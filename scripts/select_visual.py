"""Read the bundled visual catalog without loading the full upstream project."""
from pathlib import Path
import argparse,json
def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--query',default='');p.add_argument('--kind',choices=['art','grammar','production']);p.add_argument('--json',action='store_true');p.add_argument('--ready',action='store_true',help='Component tests/material sources only, not finished-film templates')
 args=p.parse_args();root=Path(__file__).resolve().parents[1]
 if args.ready:
  kits=json.loads((root/'assets/production-kit/registry.json').read_text('utf-8'))
  found=[{'id':k,**v,'scope':'component-test-only','command':f'python scripts/production.py component-test --episode YOUR_TEST --kit {k} --aspect portrait'} for k,v in kits.items() if not args.query or any(q.casefold() in json.dumps(v,ensure_ascii=False).casefold() for q in args.query.split())]
  if args.json:print(json.dumps(found,ensure_ascii=False,indent=2))
  else:
   print('仅供组件测试和取材。新片请用 start_episode.py 迁移完整工程；不要把这些小样扩写成默认成片。')
   for i in found:print(f"{i['id']} | {i['title']} | import {i['symbol']}\n  {i['command']}")
  return
 data=json.loads((root/'assets/weilanx/catalog.json').read_text('utf-8'))
 found=[i for i in data if (not args.kind or i['kind']==args.kind) and args.query.casefold() in json.dumps(i,ensure_ascii=False).casefold()]
 if args.json:print(json.dumps(found,ensure_ascii=False,indent=2))
 else:
  for i in found:
   print(f"{i['id']} | {i['title']} | {i['kind']}\n  {i.get('motion','')}\n  配方: {i['recipe']}\n  代码: {', '.join(i['code'])}")
  print(f'匹配 {len(found)} 项。预览图与实际采用状态请查看 examples/gallery/index.html。')
if __name__=='__main__':main()
