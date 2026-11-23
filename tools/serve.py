#!/usr/bin/env python3
"""Local server for the game that forbids browser caching, so a reload always gets the latest js files.
Usage: python3 tools/serve.py [port]   (default 8765), then open http://localhost:8765/"""
import functools, http.server, os, sys


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
http.server.ThreadingHTTPServer(('', port), functools.partial(Handler, directory=root)).serve_forever()
