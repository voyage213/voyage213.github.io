"""本機預覽用的靜態檔案伺服器。

不用 `python3 -m http.server`，因為它的 __main__ 區塊會在 argparse
建立預設值時呼叫 os.getcwd()，在某些沙箱下會直接 PermissionError。
這裡改成先 chdir 到專案根目錄再起 server。
"""

import functools
import http.server
import os
import socketserver

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 4173

os.chdir(ROOT)

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)


class Server(socketserver.TCPServer):
    allow_reuse_address = True


with Server(("127.0.0.1", PORT), Handler) as httpd:
    print(f"serving {ROOT} at http://127.0.0.1:{PORT}", flush=True)
    httpd.serve_forever()
