"""Retrieve bounded production experience; validate a decision record, never rate a film."""
from pathlib import Path
from datetime import datetime, timezone
import argparse
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / 'references/experience'
STAGES = ('plan', 'script', 'storyboard', 'render', 'review', 'repair', 'delivery')
DEFAULTS = {
    'plan': ['E20', 'E03', 'E16'], 'script': ['E01', 'E03', 'E09'],
    'storyboard': ['E20', 'E21', 'E05'], 'render': ['E09', 'E18', 'E15'],
    'review': ['E20', 'E19', 'E21'], 'repair': ['E11', 'E20', 'E21'],
    'delivery': ['E19', 'E12'],
}


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def catalog():
    return read_json(LIB / 'index.json')['cases']


def digest(path):
    # Version text, not platform line endings: Git may check out CRLF on Windows.
    return hashlib.sha256(path.read_text(encoding='utf-8').encode('utf-8')).hexdigest()


def card_path(item):
    path = (ROOT / item['card']).resolve()
    if not path.is_relative_to((LIB / 'cards').resolve()):
        raise ValueError('Card path escapes the experience library')
    return path


def encode(value):
    return json.dumps(value, ensure_ascii=False, indent=2)


def reflections():
    return read_json(LIB / 'reflections.json')['cases']


def reflection(reflection_id):
    item = next((x for x in reflections() if x['id'] == reflection_id), None)
    if item is None:
        raise ValueError('Unknown reflection ID: ' + reflection_id)
    return item


def reflection_summary(item):
    return {key: item[key] for key in ('id', 'title', 'status', 'decision')}


def select(stage, query='', limit=3, max_chars=6500, route=''):
    items = catalog()
    query = query.casefold().strip()
    known_routes = {r for case in reflections() for r in case['routes']}
    if route and route not in known_routes:
        raise ValueError('Unknown reflection route: ' + route + '; available: ' + ', '.join(sorted(known_routes)))
    relevant = [case for case in reflections() if
                (route and route in case['routes']) or
                (query and any(s.casefold() in query for s in case['signals']))]
    routed_ids = {eid for case in relevant for eid in case['experience_ids']}
    ranked = []
    for item in items:
        if stage not in item['stages']:
            continue
        matches = [s for s in item['signals'] if s.casefold() in query]
        if query and not matches and item['id'] not in routed_ids:
            continue
        if not query and item['id'] not in (routed_ids if route else DEFAULTS[stage]):
            continue
        score = sum(min(len(s), 8) for s in matches) if query else (100 - DEFAULTS[stage].index(item['id']) if item['id'] in DEFAULTS[stage] else 0)
        if item['id'] in routed_ids:
            score += 1000
        ranked.append((score, item, matches))
    ranked.sort(key=lambda row: (-row[0], row[1]['id']))
    result = {
        'stage': stage, 'query': query, 'route': route, 'cases': [],
        'reflections': [reflection_summary(x) for x in relevant],
        'remaining_ids': [], 'budget_omitted_ids': [],
        'note': 'Historical guidance, not proof of reading, understanding or film quality. Read only selected cards; current user instructions take precedence.',
    }
    for _, item, matches in ranked[:limit]:
        path = card_path(item)
        if digest(path) != item['sha256']:
            raise ValueError('Card hash differs from index: ' + item['id'])
        result['cases'].append({
            'id': item['id'], 'matched_signals': matches, 'path': item['card'],
            'sha256': item['sha256'], 'content': path.read_text(encoding='utf-8'),
        })
    result['remaining_ids'] = [row[1]['id'] for row in ranked[limit:]]
    while len(encode(result)) + 1 > max_chars and result['cases']:
        result['budget_omitted_ids'].insert(0, result['cases'].pop()['id'])
    if not ranked:
        result['note'] = 'No matching case in this stage. Try a more specific symptom, another stage, or read an explicit ID; do not invent historical support.'
    if len(encode(result)) + 1 > max_chars:
        raise ValueError('Output budget too small for routing metadata')
    return result


def validate_library():
    errors = []
    items = catalog()
    ids = [x['id'] for x in items]
    sources = {x['id']: x for x in read_json(LIB / 'sources.json')['sources']}
    if len(ids) != len(set(ids)):
        errors.append('Duplicate case IDs')
    for item in items:
        path = card_path(item)
        if not path.is_file() or digest(path) != item['sha256']:
            errors.append('Missing or changed card: ' + item['id'])
        if not item['stages'] or set(item['stages']) - set(STAGES):
            errors.append('Invalid stage: ' + item['id'])
        for sid in item['sources']:
            if sid not in sources:
                errors.append('Missing evidence source: ' + sid)
    for source in sources.values():
        if 'extract' in source and not (ROOT / source['extract']).is_file():
            errors.append('Missing public extract: ' + source['id'])
    reflection_ids = set()
    for case in reflections():
        if case['id'] in reflection_ids:
            errors.append('Duplicate reflection: ' + case['id'])
        reflection_ids.add(case['id'])
        if case['status'] not in ('user-rejected', 'mixed-feedback', 'unverified'):
            errors.append('Invalid reflection status: ' + case['id'])
        for eid in case['experience_ids']:
            if eid not in ids:
                errors.append('Missing experience: ' + eid)
        for key in ('feedback', 'observation_scope', 'failed_strategy', 'decision', 'retest'):
            if not case.get(key):
                errors.append('Missing reflection field ' + key + ': ' + case['id'])
        for rel in case['evidence'] + [case[k] for k in ('media', 'poster') if case.get(k)]:
            path = (ROOT / rel).resolve()
            if not path.is_relative_to(ROOT.resolve()):
                errors.append('Reflection path escapes repository: ' + rel)
            # Sparse installs intentionally do not materialize the public media library.
            elif rel.startswith('references/') and not path.is_file():
                errors.append('Missing reflection evidence: ' + rel)
    return {'cases': len(items), 'sources': len(sources), 'errors': errors,
            'scope': 'Catalog integrity and evidence availability only; no behavioral or aesthetic certification.'}


def check_use(receipt, decisions):
    errors = []
    current = {x['id']: x for x in catalog()}
    selected = receipt.get('selected', [])
    ids = [x.get('id') for x in selected]
    if receipt.get('schema_version') != 1 or not ids or len(ids) != len(set(ids)):
        errors.append('Receipt must contain a nonempty, unique selected case set')
    for item in selected:
        case = current.get(item.get('id'))
        if not case or item.get('sha256') != case['sha256'] or digest(card_path(case)) != case['sha256']:
            errors.append('Unknown or changed case: ' + str(item.get('id')))
    used = decisions.get('decisions', [])
    used_ids = [x.get('case_id') for x in used]
    if set(used_ids) != set(ids) or len(used_ids) != len(set(used_ids)):
        errors.append('Each retrieved case needs exactly one apply or not-applicable decision')
    for item in used:
        if item.get('disposition') not in ('apply', 'not-applicable'):
            errors.append('Invalid disposition: ' + str(item.get('case_id')))
        for field in ('target', 'reason', 'preserve', 'verification'):
            if not isinstance(item.get(field), str) or not item[field].strip():
                errors.append('Missing ' + field + ': ' + str(item.get('case_id')))
    return {'status': 'incomplete' if errors else 'record-complete', 'errors': errors,
            'scope': 'Only checks traceability and required fields. Does not prove the agent read, applied or correctly judged the case. Does not inspect media.'}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    commands = p.add_subparsers(dest='command', required=True)
    s = commands.add_parser('select')
    s.add_argument('--stage', choices=STAGES, required=True)
    s.add_argument('--query', default='')
    s.add_argument('--route', default='', help='Known source route; includes its user feedback even with no keyword query')
    s.add_argument('--limit', type=int, choices=range(1, 6), default=3)
    s.add_argument('--max-chars', type=int, default=6500)
    s.add_argument('--receipt', type=Path, help='Optional local retrieval receipt; does not contain the full query or article.')
    r = commands.add_parser('read'); r.add_argument('id')
    r = commands.add_parser('reflection'); r.add_argument('id', nargs='?', help='Without ID, list brief reflection records only')
    commands.add_parser('validate')
    c = commands.add_parser('check-use')
    c.add_argument('--receipt', type=Path, required=True)
    c.add_argument('--use', type=Path, required=True)
    args = p.parse_args()
    try:
        if args.command == 'select':
            if not 2000 <= args.max_chars <= 20000:
                raise ValueError('--max-chars must be between 2000 and 20000')
            result = select(args.stage, args.query, args.limit, args.max_chars, args.route)
            if args.receipt:
                receipt = {'schema_version': 1, 'stage': args.stage, 'route': args.route,
                           'created_at': datetime.now(timezone.utc).isoformat(),
                           'selected': [{'id': x['id'], 'sha256': x['sha256']} for x in result['cases']],
                           'budget_omitted_ids': result['budget_omitted_ids']}
                args.receipt.parent.mkdir(parents=True, exist_ok=True)
                args.receipt.write_text(encode(receipt) + '\n', encoding='utf-8')
        elif args.command == 'read':
            case = next((x for x in catalog() if x['id'] == args.id), None)
            if not case:
                raise ValueError('Unknown case ID: ' + args.id)
            if digest(card_path(case)) != case['sha256']:
                raise ValueError('Card hash differs from index: ' + args.id)
            print(card_path(case).read_text(encoding='utf-8')); return 0
        elif args.command == 'reflection':
            result = reflection(args.id) if args.id else [reflection_summary(x) for x in reflections()]
        elif args.command == 'validate':
            result = validate_library()
        else:
            result = check_use(read_json(args.receipt), read_json(args.use))
        print(encode(result))
        return 2 if result.get('errors') else 0
    except (ValueError, KeyError, TypeError, OSError) as exc:
        print(encode({'error': str(exc)}), file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
