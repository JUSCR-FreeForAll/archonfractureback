#!/usr/bin/env python3
"""TRE of Life local, read-only parallel companion. Python standard library only."""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from datetime import datetime, timezone

MODEL = {
    "name": "TRE of Life / Time Realm Engine",
    "version": "0.2.0-reference",
    "sequence": [0, -0.5, -1, 0.5, 0, 1, 1, 2, 3, 5],
    "phase_days": 3,
    "count_range": [1, 10],
    "radix_rule": "counts 1-3 use radix 3; counts 4-10 use radix equal to count",
    "realm_mapping": {
        "-1": "ouroboros / backward-facing symbolic domain",
        "0": "Earth Realm 2 / dual-zero origin ground (0_m and 0_f)",
        "1": "Realm 3",
        "2": "Realm 4",
        "3": "higher-order-unmapped",
        "5": "higher-order-unmapped"
    },
    "status": "local snapshot; not a live database connection"
}
EXPECTED = [0, -0.5, -1, 0.5, 0, 1, 1, 2, 3, 5]
PAGE = """<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TRE of Life — Local Companion</title>
<style>body{font:16px system-ui;max-width:850px;margin:3rem auto;padding:0 1rem;background:#101923;color:#edf2f7}main{background:#1b2936;padding:1.5rem;border-radius:14px}pre{white-space:pre-wrap;overflow-wrap:anywhere;color:#bde3d1}h1{margin-bottom:.2rem}small{color:#b8c5d1}.pill{display:inline-block;padding:.3rem .7rem;border:1px solid #78b99a;border-radius:2rem}button{padding:.7rem 1rem;border-radius:8px;border:0;cursor:pointer}</style>
<main><h1>TRE of Life</h1><p>Independent Time Realm Engine · local parallel companion</p><span class="pill">OFFLINE / READ-ONLY</span>
<p>This computer holds a local model snapshot. It is not claiming a live connection to GitHub, Replit, a database, or another AI system.</p>
<h2>Integrity check</h2><div id="check">Loading…</div><h2>Model snapshot</h2><pre id="model"></pre><p><small>Local address only: 127.0.0.1. No data is uploaded or synchronized.</small></p><button onclick="location.reload()">Reload snapshot</button></main>
<script>fetch('/api/status').then(r=>r.json()).then(d=>{document.getElementById('check').textContent=d.integrity?'PASS — expected sequence matches local snapshot':'FAIL — sequence mismatch';document.getElementById('model').textContent=JSON.stringify(d.model,null,2)}).catch(e=>document.getElementById('check').textContent='Unable to load: '+e)</script></html>"""

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/status":
            payload = json.dumps({"integrity": MODEL["sequence"] == EXPECTED,
                "checked_at_utc": datetime.now(timezone.utc).isoformat(), "model": MODEL}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        elif self.path in ("/", "/index.html"):
            payload = PAGE.encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        else:
            self.send_error(404)
    def log_message(self, fmt, *args):
        print("%s - %s" % (self.address_string(), fmt % args))

if __name__ == "__main__":
    host, port = "127.0.0.1", 8765
    print("TRE of Life local companion")
    print("Open http://127.0.0.1:%d in your browser. Stop with Ctrl+C." % port)
    HTTPServer((host, port), Handler).serve_forever()
