import http.server
import socketserver
import os

PORT = 8080
DIRECTORY = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist", "public")

class SPAServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not '.' in os.path.basename(self.path):
            self.path = '/index.html'
        return super().do_GET()

print(f"\n===================================================")
print(f"  JanSathi Production Server Live on Port {PORT}")
print(f"  Open in browser: http://localhost:{PORT}")
print(f"===================================================\n")

try:
    with socketserver.TCPServer(("127.0.0.1", PORT), SPAServer) as httpd:
        httpd.serve_forever()
except Exception as err:
    print(f"Server Startup Error: {err}")
