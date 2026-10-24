"""Read the bundled visual catalog without loading the full upstream project."""
from pathlib import Path
import argparse,json
def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--query',default='');p.add_argument('--kind',choices=['art','grammar','production']);p.add_argument('--json',action='store_true')
 args=p.parse_args();root=Path(__file__).resolve().parents[1]
 data=json.loads((root/'assets/weilanx/catalog.json').read_text('utf-8'))
 found=[i for i in data if (not args.kind or i['kind']==args.kind) and args.query.casefold() in json.dumps(i,ensure_ascii=False).casefold()]
 if args.json:print(json.dumps(found,ensure_ascii=False,indent=2))
 else:
  for i in found:
   print(f"{i['id']} | {i['title']} | {i['kind']}\n  {i.get('motion','')}\n  配方: {i['recipe']}\n  代码: {', '.join(i['code'])}")
  print(f'匹配 {len(found)} 项。预览图与实际采用状态请查看 examples/gallery/index.html。')
if __name__=='__main__':main()
