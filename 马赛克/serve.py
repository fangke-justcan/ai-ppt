"""本地开发服务器：禁用缓存，改完 index.html / 着色器刷新即见最新效果。
用法：python serve.py  （默认端口 8321，可用参数指定，如 python serve.py 8000）
"""
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8321


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        SimpleHTTPRequestHandler.end_headers(self)


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", PORT), NoCacheHandler).serve_forever()
