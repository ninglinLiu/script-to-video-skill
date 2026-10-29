"""Build viewable evidence from the two hash-pinned public references (no audio).

python scripts/build_reference_evidence.py --sources PATH_TO_TWO_STYLE_BENCHMARKS
This is a study-media exporter, not a reproduction renderer.
"""
import argparse,csv,hashlib,json,pathlib,shutil,subprocess
from PIL import Image,ImageDraw,ImageFont
ROOT=pathlib.Path(__file__).resolve().parents[1]
WEB=ROOT/'examples/reference-study-20261029'
OUT=WEB/'motion'
def sha(p):return hashlib.file_digest(p.open('rb'),'sha256').hexdigest()
def run(args):subprocess.run(['ffmpeg','-v','error','-y',*map(str,args)],check=True)
def sheet(paths,times,dest,cols=4):
 thumbs=[]
 for p,t in zip(paths,times):
  im=Image.open(p).convert('RGB');im.thumbnail((260,462));canvas=Image.new('RGB',(280,500),'#101819');canvas.paste(im,((280-im.width)//2,24));ImageDraw.Draw(canvas).text((12,478),f'{t:.2f}s',fill='#ffe2a5');thumbs.append(canvas)
 result=Image.new('RGB',(cols*280,((len(thumbs)+cols-1)//cols)*500),'#101819')
 for i,im in enumerate(thumbs):result.paste(im,((i%cols)*280,(i//cols)*500))
 result.save(dest,quality=91)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--sources',type=pathlib.Path,required=True);a=ap.parse_args()
 plan=json.loads((ROOT/'references/reference-study-20261029/plan.json').read_text('utf8'))
 events=json.loads((WEB/'motion-events.json').read_text('utf8'));OUT.mkdir(exist_ok=True)
 sources={s['key']:a.sources/s['key']/'source.mp4' for s in plan['sources']}
 for s in plan['sources']:
  if sha(sources[s['key']])!=s['sha256']:raise ValueError('Input does not match the allowed public reference: '+s['key'])
 for c in events['clips']:
  video=OUT/(c['id']+'.mp4');src=sources[c['reference']]
  if not video.exists():run(['-ss',c['start'],'-i',src,'-t',c['end']-c['start'],'-map','0:v:0','-an','-vf','format=yuv420p','-c:v','libx264','-preset','fast','-crf','19','-threads','2','-movflags','+faststart',video])
  c['video']='motion/'+video.name;c['sha256']=sha(video);c['bytes']=video.stat().st_size;c['frames']=[]
  paths=[]
  for i,t in enumerate(c['checkpoints']):
   f=OUT/f'{c["id"]}-{i:02}.jpg'
   if not f.exists():run(['-ss',max(0,min(t-c['start'],c['end']-c['start']-1/30)),'-i',video,'-frames:v','1','-vf','scale=480:-2','-q:v','2',f])
   paths.append(f);c['frames'].append({'source_time':t,'clip_time':round(t-c['start'],3),'image':'motion/'+f.name,'sha256':sha(f)})
  c['poster']=c['frames'][0]['image'];c['contact_sheet']='motion/'+c['id']+'-sequence.jpg'
  sheet(paths,c['checkpoints'],WEB/c['contact_sheet'])
  c['contact_sheet_sha256']=sha(WEB/c['contact_sheet'])
  for idx,p in enumerate(c['phases']):
   p['clip_start']=round(p['start']-c['start'],3);p['clip_end']=round(p['end']-c['start'],3)
   p['frame_indices']=[i for i,t in enumerate(c['checkpoints']) if p['start']<=t<=p['end']]
  print(c['id'],round(c['bytes']/1e6,1),'MB',flush=True)
 (WEB/'motion-events.json').write_text(json.dumps(events,ensure_ascii=False,indent=2),'utf8')
 rows=list(csv.DictReader((ROOT/'references/reference-study-20261029/shot-observations.csv').open(encoding='utf-8-sig')))
 for i,r in enumerate(rows):
  vals=list(r.values());ref='shuangge' if vals[0]=='R26' else 'lifeos';start,end=float(vals[1]),float(vals[2]);times=[start+.1,(start+end)/2,end-.1];paths=[]
  for j,t in enumerate(times):
   f=OUT/f'shot-{i+1:02}-{j}.jpg'
   if not f.exists():run(['-ss',t,'-i',sources[ref],'-frames:v','1','-vf','scale=480:-2','-q:v','3',f])
   paths.append(f)
  r['frames']=[{'source_time':t,'image':'motion/'+f.name} for t,f in zip(times,paths)]
  r['contact_sheet']=f'motion/shot-{i+1:02}.jpg';sheet(paths,times,WEB/r['contact_sheet'],cols=3)
 (WEB/'shot-evidence.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),'utf8')
 print('complete',len(events['clips']),'clips',len(rows),'illustrated observations',flush=True)
if __name__=='__main__':main()
