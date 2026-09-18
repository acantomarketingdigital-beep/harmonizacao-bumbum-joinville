"""Serve the repository with consistent image MIME types on Windows."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial

SimpleHTTPRequestHandler.extensions_map.update({'.webp': 'image/webp', '.js': 'text/javascript'})
handler = partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).resolve().parents[1]))
print('Serving http://127.0.0.1:4174', flush=True)
ThreadingHTTPServer(('127.0.0.1', 4174), handler).serve_forever()
