from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import os,json
p=Path(__file__).resolve().parent
s=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(p)))
(p/'preview.json').write_text(json.dumps({'url':f'http://127.0.0.1:{s.server_port}/watch.html','pid':os.getpid()}),encoding='utf-8')
s.serve_forever()
