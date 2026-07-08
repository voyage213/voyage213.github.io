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

class Handler(http.server.SimpleHTTPRequestHandler):
    """靜態檔案 + 一個 /save 端點（把設計檔從瀏覽器搬回硬碟用）。"""

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def do_OPTIONS(self):
        # Chrome 的 Private Network Access：公網 https 頁面要打到 localhost，
        # 會先送 preflight，必須回 Allow-Private-Network 才放行
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'content-type')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.end_headers()

    def do_POST(self):
        if not self.path.startswith('/save/'):
            self.send_error(404)
            return
        name = os.path.basename(self.path[len('/save/'):]) or 'upload.bin'
        length = int(self.headers.get('Content-Length', 0))
        if length > 20 * 1024 * 1024:
            self.send_error(413)
            return
        data = self.rfile.read(length)
        dest = os.path.join(ROOT, '.claude', 'inbox')
        os.makedirs(dest, exist_ok=True)
        with open(os.path.join(dest, name), 'wb') as f:
            f.write(data)
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b'ok')


class Server(socketserver.TCPServer):
    allow_reuse_address = True


with Server(("127.0.0.1", PORT), Handler) as httpd:
    print(f"serving {ROOT} at http://127.0.0.1:{PORT}", flush=True)
    httpd.serve_forever()
