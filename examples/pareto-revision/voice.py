"""Adapted from warsh-gold-20261022/full-v2/voice.py.

Real EdgeTTS word boundaries; semantic subtitles derive from chapters/cues.
Never plays sound. No tempo resampling. One cached request per text/rate.
"""
from pathlib import Path
import asyncio
import hashlib
import json
import math
import re
import subprocess
import time

import edge_tts

P = Path(__file__).resolve().parent
spec = json.loads((P / 'source/script.json').read_text(encoding='utf-8'))
norm = lambda s: ''.join(x for x in s if x.isalnum()).lower()


def semantic_groups(chapters):
    """Keep authored clauses, sentence endings and chapter boundaries intact."""
    groups = []
    offset = 0
    limit = spec.get('subtitleMaxChineseChars', 28)
    for ch in chapters:
        assert len(ch['cues']) == len(ch['p']), ch['id']
        current = []
        count = 0
        for local, (cue, punctuation) in enumerate(zip(ch['cues'], ch['p'])):
            n = len(re.findall(r'[\u4e00-\u9fff]', cue))
            if n > limit:
                raise ValueError(f'Authored cue exceeds {limit} Chinese characters: {cue}')
            if current and count + n > limit:
                groups.append(current)
                current = []
                count = 0
            current.append(offset + local)
            count += n
            if punctuation in '.!?。！？':
                groups.append(current)
                current = []
                count = 0
        if current:
            groups.append(current)
        offset += len(ch['cues'])
    return groups


async def main():
    review = json.loads((P / 'evidence/script-review.json').read_text(encoding='utf-8'))
    draft_hash = hashlib.sha256((P / 'source/draft.txt').read_bytes()).hexdigest()
    valid_hash = any(x.get('path') == 'source/draft.txt' and x.get('sha256', '').lower() == draft_hash for x in review.get('reviewedFiles', []))
    if not (review.get('ttsAllowed') is True and valid_hash):
        raise RuntimeError('Current draft must have a real, hash-bound review before TTS.')
    if not spec.get('factsStatus', '').startswith('approved'):
        raise RuntimeError('Fact-check approval required before TTS.')
    for directory in ['assets', 'qa', 'out', '工程/src', 'source']:
        (P / directory).mkdir(parents=True, exist_ok=True)
    approved_text = ''.join(x.strip() for x in re.split(r'【[^】]+】\n', (P / 'source/draft.txt').read_text(encoding='utf-8-sig'))[1:])
    spoken_text = ''.join(''.join(a+b for a,b in zip(ch['cues'],ch['p'])) for ch in spec['chapters'])
    if approved_text != spoken_text:
        raise RuntimeError('Draft and spoken JSON differ; review the actual script.')
    chunks = [x for ch in spec['chapters'] for x in ch['cues']]
    text = ''.join(''.join(a + b for a, b in zip(ch['cues'], ch['p'])) for ch in spec['chapters'])
    draft = '\n\n'.join(ch['title'] + '\n' + ''.join(a + b for a, b in zip(ch['cues'], ch['p'])) for ch in spec['chapters'])
    # source/draft.txt remains the reviewed source of truth; do not create a duplicate manuscript.
    key = hashlib.sha256((text + spec['voice'] + spec['rate'] + edge_tts.__version__).encode()).hexdigest()
    mp3 = P / 'assets/voice.mp3'
    bp = P / 'assets/word-boundaries.json'
    meta = P / 'qa/voice.json'
    start = time.time()
    cached = meta.exists() and mp3.exists() and bp.exists() and json.loads(meta.read_text(encoding='utf-8')).get('key') == key
    if not cached:
        events = []
        talk = edge_tts.Communicate(text, spec['voice'], rate=spec['rate'], boundary='WordBoundary', connect_timeout=20, receive_timeout=90)
        with mp3.open('wb') as f:
            async for e in talk.stream():
                if e['type'] == 'audio':
                    f.write(e['data'])
                elif e['type'] == 'WordBoundary':
                    events.append(e)
        if not events:
            raise RuntimeError('No boundaries, no substitute voice')
        bp.write_text(json.dumps(events, ensure_ascii=False, indent=2), encoding='utf-8')
    else:
        events = json.loads(bp.read_text(encoding='utf-8'))
    cues = []
    acc = ''
    words = []
    i = 0
    for e in events:
        acc += e['text']
        words.append(e)
        if norm(acc) == norm(chunks[i]):
            cues.append({'text': chunks[i], 'start': spec['delay'] + words[0]['offset'] / 1e7, 'end': spec['delay'] + (words[-1]['offset'] + words[-1]['duration']) / 1e7})
            acc = ''
            words = []
            i += 1
            if i == len(chunks):
                break
        elif not norm(chunks[i]).startswith(norm(acc)):
            raise RuntimeError(f'Boundary mismatch: {acc} / {chunks[i]}')
    assert len(cues) == len(chunks), (len(cues), len(chunks))
    vd = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', str(mp3)], text=True))
    duration = math.ceil((max(vd + spec['delay'], cues[-1]['end']) + spec['tail']) * 30) / 30
    chapters = []
    idx = 0
    for ch in spec['chapters']:
        n = len(ch['cues'])
        chapters.append({'id': ch['id'], 'title': ch['title'], 'cueStart': idx, 'cueEnd': idx + n - 1, 'start': 0 if idx == 0 else max(0, cues[idx]['start'] - .13), 'voiceStart': cues[idx]['start'], 'voiceEnd': cues[idx + n - 1]['end']})
        idx += n
    for i, ch in enumerate(chapters):
        ch['end'] = chapters[i + 1]['start'] if i + 1 < len(chapters) else duration
    groups = semantic_groups(spec['chapters'])
    punctuation = [p for ch in spec['chapters'] for p in ch['p']]
    subtitles = [{'text': ''.join(cues[i]['text'] + punctuation[i] for i in group).rstrip('，；：、'), 'start': cues[group[0]]['start'], 'end': cues[group[-1]]['end'], 'cueIndices': group} for group in groups]
    assert [i for g in groups for i in g] == list(range(len(cues)))
    assert all(len(re.findall(r'[\u4e00-\u9fff]', sub['text'])) <= spec.get('subtitleMaxChineseChars', 28) for sub in subtitles)
    for group in groups:
        assert any(ch['cueStart'] <= group[0] <= group[-1] <= ch['cueEnd'] for ch in chapters), group
    tl = {'cues': cues, 'subtitles': subtitles, 'chapters': chapters, 'seconds': duration, 'frames': round(duration * 30), 'fps': 30, 'wordBoundarySource': 'real edge-tts WordBoundary', 'voiceRate': spec['rate'], 'key': key}
    for dest in ['工程/src/timing.json', 'assets/timeline.json']:
        (P / dest).write_text(json.dumps(tl, ensure_ascii=False, indent=2), encoding='utf-8')

    def stamp(t):
        m = round(t * 1000)
        return f'{m // 3600000:02}:{m // 60000 % 60:02}:{m // 1000 % 60:02},{m % 1000:03}'

    (P / 'out/subtitles.srt').write_text('\n\n'.join(f'{i + 1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i, c in enumerate(subtitles)) + '\n', encoding='utf-8-sig')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(mp3), '-af', f'adelay={round(spec["delay"] * 1000)}:all=1,apad=whole_dur={duration},loudnorm=I=-16:TP=-2:LRA=7', '-t', str(duration), '-ar', '48000', '-ac', '2', str(P / 'assets/voice-track.wav')], check=True)
    metadata = {'key': key, 'voice': spec['voice'], 'rate': spec['rate'], 'cached': cached, 'successfulRequests': 0 if cached else 1, 'wallSeconds': time.time() - start, 'duration': vd, 'timelineDuration': duration, 'chineseCharacters': len(re.findall(r'[\u4e00-\u9fff]', text)), 'cueCount': len(cues), 'subtitleCount': len(subtitles), 'speakerPlayback': False, 'manualListening': False, 'paidAPICalls': 0, 'timeStretching': False}
    meta.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'duration': duration, 'voiceDuration': vd, 'cues': len(cues), 'subtitles': len(subtitles), 'chapters': chapters}, ensure_ascii=True))


asyncio.run(main())
