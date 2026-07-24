"""
ddddocr CAPTCHA microservice - runs locally on port 5001
Node.js calls this via HTTP instead of spawning a new Python process each time.
"""
import base64
import sys
import io
from PIL import Image, ImageFilter, ImageEnhance, ImageOps

try:
    from http.server import HTTPServer, BaseHTTPRequestHandler
    import ddddocr
    import json

    ocr = ddddocr.DdddOcr(show_ad=False)
    print("[ddddocr] Model loaded. Listening on http://127.0.0.1:5001", flush=True)

    def preprocess_image(img):
        w, h = img.size
        target_h = 100
        if h > 0:
            new_w = max(1, int(w * target_h / h))
            img = img.resize((new_w, target_h), Image.LANCZOS)

        if img.mode != 'L':
            img = img.convert('L')

        img = ImageOps.autocontrast(img, cutoff=2)
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(3.0)
        img = enhancer.enhance(1.0)

        img = img.filter(ImageFilter.MinFilter(3))
        img = img.filter(ImageFilter.MaxFilter(3))

        img = img.point(lambda p: 255 if p > 128 else 0)

        return img

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, format, *args):
            pass

        def do_POST(self):
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            data = json.loads(body)
            b64 = data.get('image', '')
            try:
                img_bytes = base64.b64decode(b64)
                img = Image.open(io.BytesIO(img_bytes))
                processed = preprocess_image(img)

                buf = io.BytesIO()
                processed.save(buf, format='PNG')
                result = ocr.classification(buf.getvalue())
                result = result.strip().replace(' ', '')
            except Exception as e:
                print(f"[ddddocr] OCR error: {e}", flush=True)
                result = ''

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'result': result}).encode())

    server = HTTPServer(('127.0.0.1', 5001), Handler)
    server.serve_forever()

except Exception as e:
    print(f"[ddddocr] FAILED TO START: {e}", flush=True)
    sys.exit(1)
