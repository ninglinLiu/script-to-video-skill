"""Validate the curated local gallery and vendored source identity; does not rate aesthetics."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import argparse,hashlib,json,subprocess
class Links(HTMLParser):
 def __init__(self):super().__init__();self.urls=[];self.autoplay=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  for key in ['src','href']:
   if key in d:self.urls.append(d[key])
  if tag in ['video','audio'] and 'autoplay' in d:self.autoplay.append(tag)
def main():
 a=argparse.ArgumentParser();a.add_argument('--media',action='store_true');a.add_argument('--output',type=Path);args=a.parse_args()
 r=Path(__file__).resolve().parents[1];g=r/'examples/gallery';manifest=json.loads((g/'manifest.json').read_text('utf-8'));prov=json.loads((r/'assets/weilanx/provenance.json').read_text('utf-8'));errors=[]
 for path in sorted(g.glob('*.html')):
  p=Links();p.feed(path.read_text('utf-8'))
  if p.autoplay:errors.append(f'autoplay:{path.relative_to(r)}')
  for href in p.urls:
   parsed=urlparse(href)
   if parsed.scheme or href.startswith('#'):continue
   target=(path.parent/unquote(parsed.path)).resolve()
   if not target.is_relative_to(r):errors.append(f'path escapes repo:{path.name}:{href}')
   elif not target.exists():errors.append(f'missing:{path.name}:{href}')
 for item in prov['files']:
  path=r/item['path']
  if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=item['sha256']:errors.append('upstream hash mismatch:'+item['path'])
 readme=(r/'README.md').read_text('utf-8')
 # The source icon stays in the vendored files, but is not a README display requirement.
 display_graphics=[p for p in prov['readme_graphics'] if p.startswith('docs/assets/styles/')]
 for graphic in display_graphics:
  if 'assets/weilanx/upstream/'+graphic not in readme:errors.append('README missing graphic:'+graphic)
 for media in manifest['historical_media']:
  path=r/media['target']
  if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=media['sha256']:errors.append('media hash mismatch:'+media['target'])
  if args.media and path.is_file():
   info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
   if any(s.get('codec_type')=='audio' for s in info['streams']):errors.append('audio in preview:'+media['target'])
   if abs(float(info['format']['duration'])-media['seconds'])>.06:errors.append('duration mismatch:'+media['target'])
 report={'substantive_pages':manifest['substantive_pages'],'imported_html':len(manifest['imported_html']),'upstream_files':len(prov['files']),'bundled_readme_graphics':len(prov['readme_graphics']),'readme_graphics':len(display_graphics),'historical_videos':len(manifest['historical_media']),'media_probe':args.media,'errors':errors,'scope':'File identity, local links and optional media checks; no aesthetic certification.'}
 if args.output:args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
 print(json.dumps(report,ensure_ascii=False,indent=2));return 1 if errors else 0
if __name__=='__main__':raise SystemExit(main())
