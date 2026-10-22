"""
Minimal mock of the Supabase PostgREST endpoint used by the waitlist route.

  python tools/mock_supabase.py [port]     # default 8321

Implements:  POST /rest/v1/waitlist_signups
  - stores rows in memory and appends them to tools/mock_supabase_store.json
  - returns 409 {"code":"23505",...} for duplicate lower(email), exactly like
    PostgREST does for a unique-violation, so the API's duplicate path runs
  - returns 422 {"code":"23514",...} when consent_marketing is false (CHECK)
         GET  /rest/v1/waitlist_signups?field=eq.value[...]
  - filters rows by equality on `field` (referral_code / referred_by / email)

Development/testing only. Never point production at this file.
"""
import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8321
STORE_PATH = os.environ.get("WAITLIST_MOCK_STORE_PATH", "tools/mock_supabase_store.json")
lock = threading.Lock()


def load_store():
    try:
        with open(STORE_PATH, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def save_store(rows):
    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # quiet
        pass

    def _json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        # CORS the way PostgREST behind Supabase does (mirrors supabase-js needs)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "POST,OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._json(200, {})

    def do_GET(self):
        if not self.path.startswith("/rest/v1/waitlist_signups"):
            return self._json(404, {"message": "not found"})
        from urllib.parse import parse_qs, urlparse

        params = parse_qs(urlparse(self.path).query)
        with lock:
            rows = load_store()
        for key, values in params.items():
            if key in ("select", "limit", "order"):
                continue
            value = values[0]
            if value.startswith("eq."):
                wanted = value[3:]
                rows = [r for r in rows if str(r.get(key, "")) == wanted]
        limit = int(params.get("limit", ["1000"])[0])
        self._json(200, rows[:limit])

    def do_HEAD(self):
        if not self.path.startswith("/rest/v1/waitlist_signups"):
            return self._json(404, {"message": "not found"})
        from urllib.parse import parse_qs, urlparse

        params = parse_qs(urlparse(self.path).query)
        with lock:
            rows = load_store()
        for key, values in params.items():
            if key in ("select", "limit", "order"):
                continue
            value = values[0]
            if value.startswith("eq."):
                wanted = value[3:]
                rows = [r for r in rows if str(r.get(key, "")) == wanted]

        # PostgREST returns this header for exact-count HEAD requests; the
        # client can read the total without transferring every matching row.
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Range", f"*/{len(rows)}")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_POST(self):
        if not self.path.startswith("/rest/v1/waitlist_signups"):
            return self._json(404, {"message": "not found"})
        length = int(self.headers.get("Content-Length", 0))
        row = json.loads(self.rfile.read(length) or b"{}")

        if not row.get("consent_marketing", False):
            return self._json(422, {
                "code": "23514",
                "message": "new row for relation \"waitlist_signups\" violates check constraint \"waitlist_signups_consent_check\"",
                "details": None, "hint": None,
            })

        with lock:
            rows = load_store()
            email = (row.get("email") or "").lower()
            if any(r.get("email") == email for r in rows):
                return self._json(409, {
                    "code": "23505",
                    "message": "duplicate key value violates unique constraint",
                    "details": f"Key (lower(email))=({email}) already exists.",
                    "hint": None,
                })
            rows.append(row)
            save_store(rows)

        return self._json(201, [])


if __name__ == "__main__":
    print(f"mock supabase on http://localhost:{PORT} -> {STORE_PATH}")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
