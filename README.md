Clonotodo Renderer (Puppeteer)
==============================
Endpoints:
- GET /health -> {"ok": true}
- POST /render -> body: {"url":"https://sitio","viewport":{"width":1920,"height":1080},"userAgent":"ClonotodoRenderer/1.2"}

Despliegue rápido:
- Railway/Render/Fly.io/Docker/VPS
- Docker:  docker build -t clonotodo-renderer . && docker run -p 8080:8080 clonotodo-renderer

Luego en PHP (app/config.php):
- renderer_endpoint = "https://TU-APP/render"
- render_mode = "auto" (o "renderer")
