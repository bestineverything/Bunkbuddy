"""
Multi-threaded ddddocr CAPTCHA microservice - runs locally on port 5002 for experimental testing.
Uses ThreadingHTTPServer so concurrent solves do not serialize or block each other.
"""
import base64
import sys
import json
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import ddddocr

try:
    ocr = ddddocr.DdddOcr(show_ad=False)
    print("[ddddocr-threaded] Model loaded into RAM. Listening on http://127.0.0.1:5002", flush=True)

    class ThreadedHandler(BaseHTTPRequestHandler):
        def log_message(self, format, *args):
            pass  # Suppress default HTTP logs for performance

        def do_POST(self):
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(length)
                data = json.loads(body)
                b64 = data.get('image', '')
                img_bytes = base64.b64decode(b64)
                
                # Perform OCR classification
                result = ocr.classification(img_bytes)
                result = result.strip().replace(' ', '')
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'result': result}).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())

    server = ThreadingHTTPServer(('127.0.0.1', 5002), ThreadedHandler)
    server.serve_forever()

except Exception as e:
    print(f"[ddddocr-threaded] FAILED TO START: {e}", flush=True)
    sys.exit(1)
