"""gunicorn configuration: Uvicorn workers serve the ASGI app (HTTP and the dashboard WebSocket)."""
from multiprocessing import cpu_count
from os import environ
from pathlib import Path


def max_workers():    
    return cpu_count()


bind = '0.0.0.0:' + environ.get('PORT', '8000')
max_requests = 1000
worker_class = 'config.workers.AsgiWorker'
workers = 2

# Development: restart workers when code or templates change (Django caches
# templates, so without this every edit needs `docker compose restart be`).
reload = environ.get("DEBUG", "True") == "True"
reload_extra_files = [str(p) for p in Path(__file__).resolve().parent.parent.glob("apps/*/templates/**/*.html")]
