# 개발용 서버: 캐시 끄기 (고친 파일이 바로 보이게)  python tools/serve.py 8790
import http.server, sys, os, functools

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8790
class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128  # 기본 5개면 게임 파일 여러 개를 한꺼번에 받을 때 연결을 거절함 (ERR_CONNECTION_REFUSED)

Server(("", port), functools.partial(NoCache, directory=root)).serve_forever()
