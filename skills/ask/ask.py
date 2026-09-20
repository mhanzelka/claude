#!/usr/bin/env python3
"""Ask the human a round of questions in a browser page, and keep the page alive.

Why a long-lived page instead of a one-shot prompt: a round is a conversation, not a form.
The human answers what is clear, asks for an explanation on what is not, and changes an earlier
answer once a later one reframes it. All of that has to survive several assistant turns, so the
page outlives any single command and the assistant pushes updates into it while it is open.

Commands:
    serve    hold the page and the round state (long-running; run it in the background)
    push     merge a JSON payload into the round and update the open page live
    wait     block until the next event, print it, exit (run it in the background to be woken)
    answers  print everything answered so far and exit
    close    shut the page down

State lives in ~/.claude/ask/<session>/ so that a command can find a running page by name alone.
"""

from __future__ import annotations

import argparse
import json
import os
import socket
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WEB = ROOT / "web"   # committed build of ui/; running never needs node
SESSIONS = Path.home() / ".claude" / "ask"

# SSE clients get a comment line this often so that proxies and sleeping laptops do not
# silently drop a connection the page has no way to notice is gone.
KEEPALIVE_S = 15.0


# --------------------------------------------------------------------------- state


def session_dir(name: str) -> Path:
    d = SESSIONS / name
    d.mkdir(parents=True, exist_ok=True)
    return d


def read_json(path: Path, default):
    try:
        return json.loads(path.read_text("utf-8"))
    except (OSError, ValueError):
        return default


def write_json(path: Path, data) -> None:
    # Written via a temp file in the same directory: `wait` polls these files from another
    # process and a half-written round would make it fail on a truncated read.
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), "utf-8")
    os.replace(tmp, path)


def append_event(d: Path, event: dict) -> dict:
    path = d / "events.jsonl"
    event = dict(event)
    event["seq"] = sum(1 for _ in path.open("r", encoding="utf-8")) + 1 if path.exists() else 1
    event["at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(event, ensure_ascii=False) + "\n")
    return event


def read_events(d: Path) -> list[dict]:
    path = d / "events.jsonl"
    if not path.exists():
        return []
    out = []
    for line in path.read_text("utf-8").splitlines():
        line = line.strip()
        if line:
            try:
                out.append(json.loads(line))
            except ValueError:
                pass
    return out


def merge_round(old: dict, new: dict) -> dict:
    """Merge a pushed payload into the round, replacing questions by id and keeping the rest.

    Questions the payload does not mention are left alone, so an update that only adds an
    explanation to one question cannot wipe out answers the human already gave to the others.

    @param old the round as it stands
    @param new the pushed payload
    @returns the merged round, ready to write and broadcast
    """
    merged = dict(old)
    for key, value in new.items():
        if key == "questions":
            by_id = {q["id"]: q for q in merged.get("questions", [])}
            order = [q["id"] for q in merged.get("questions", [])]
            for q in value:
                if q["id"] not in by_id:
                    order.append(q["id"])
                by_id[q["id"]] = {**by_id.get(q["id"], {}), **q}
            merged["questions"] = [by_id[i] for i in order]
        elif key in ("notes", "written_by") and isinstance(value, dict):
            merged[key] = {**merged.get(key, {}), **value}
        else:
            merged[key] = value
    return merged


# --------------------------------------------------------------------------- server


class Hub:
    """Fan-out for server-sent events, one queue per open page."""

    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.clients: list[list] = []

    def subscribe(self) -> list:
        q: list = []
        with self.lock:
            self.clients.append(q)
        return q

    def unsubscribe(self, q: list) -> None:
        with self.lock:
            if q in self.clients:
                self.clients.remove(q)

    def broadcast(self, payload: dict) -> None:
        line = json.dumps(payload, ensure_ascii=False)
        with self.lock:
            for q in self.clients:
                q.append(line)


TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
}


def static_file(path: str) -> tuple[Path, str] | None:
    """Resolve a request path inside the built page, refusing anything that escapes it."""
    name = "index.html" if path in ("/", "") else path.lstrip("/")
    target = (WEB / name).resolve()
    if not target.is_file() or WEB.resolve() not in target.parents:
        return None
    return target, TYPES.get(target.suffix, "application/octet-stream")


def make_handler(d: Path, hub: Hub, stop: threading.Event):

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, *_args):  # keep the background task's output readable
            pass

        def _send(self, code: int, body: bytes, ctype: str) -> None:
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def _json(self, data, code: int = 200) -> None:
            self._send(code, json.dumps(data, ensure_ascii=False).encode("utf-8"),
                       "application/json; charset=utf-8")

        def _state(self) -> dict:
            return {
                "round": read_json(d / "round.json", {}),
                "answers": read_json(d / "answers.json", {}),
                "working": read_json(d / "working.json", []),
            }

        def do_GET(self):  # noqa: N802
            path = self.path.split("?")[0]
            if path == "/api/state":
                self._json(self._state())
            elif path == "/api/stream":
                self._stream()
            elif (found := static_file(path)) is not None:
                target, ctype = found
                self._send(200, target.read_bytes(), ctype)
            else:
                self._send(404, b"not found", "text/plain")

        def _stream(self) -> None:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            q = hub.subscribe()
            last = time.time()
            try:
                self.wfile.write(b"data: " + json.dumps(self._state()).encode() + b"\n\n")
                self.wfile.flush()
                while not stop.is_set():
                    if q:
                        self.wfile.write(b"data: " + q.pop(0).encode("utf-8") + b"\n\n")
                        self.wfile.flush()
                        last = time.time()
                    elif time.time() - last > KEEPALIVE_S:
                        self.wfile.write(b": ping\n\n")
                        self.wfile.flush()
                        last = time.time()
                    else:
                        time.sleep(0.1)
            except (BrokenPipeError, ConnectionResetError, OSError):
                pass
            finally:
                hub.unsubscribe(q)

        def do_POST(self):  # noqa: N802
            path = self.path.split("?")[0]
            length = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(length) or b"{}") if length else {}
            if path == "/api/answer":
                self._answer(body)
            elif path == "/api/event":
                append_event(d, body)
                # The page shows a question as busy from the moment it is handed back until a
                # push touches it again, so nobody stares at options that are being rewritten.
                qid = body.get("qid")
                if body.get("type") in ("explain", "rejected") and qid:
                    working = read_json(d / "working.json", [])
                    if qid not in working:
                        write_json(d / "working.json", [*working, qid])
                hub.broadcast(self._state())
                self._json({"ok": True})
            elif path == "/api/refresh":
                hub.broadcast(self._state())
                self._json({"ok": True})
            elif path == "/api/quit":
                self._json({"ok": True})
                stop.set()
                threading.Thread(target=self.server.shutdown, daemon=True).start()
            else:
                self._send(404, b"not found", "text/plain")

        def _answer(self, body: dict) -> None:
            qid = body.get("qid")
            if not qid:
                self._json({"error": "qid required"}, 400)
                return
            answers = read_json(d / "answers.json", {})
            previous = answers.get(qid)
            fresh = {k: v for k, v in body.items() if k != "qid"}
            # An identical repost is not a change. Without this guard any render loop on the
            # page would turn into a stream of "changed" events and wake the assistant for
            # nothing — and a re-send of the same answer is indistinguishable from a real edit.
            if previous == fresh:
                self._json({"ok": True, "unchanged": True})
                return
            answers[qid] = fresh
            write_json(d / "answers.json", answers)
            append_event(d, {
                "type": "changed" if previous else "answered",
                "qid": qid,
                "answer": fresh,
            })
            hub.broadcast(self._state())
            self._json({"ok": True})

    return Handler


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def post(port: int, path: str, payload: dict | None = None) -> bool:
    """POST to a running page's server; returns False when nothing is listening."""
    data = json.dumps(payload or {}).encode("utf-8")
    req = urllib.request.Request(f"http://127.0.0.1:{port}{path}", data=data,
                                 headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=3).read()
        return True
    except (urllib.error.URLError, OSError):
        return False


def running_port(d: Path) -> int | None:
    try:
        return int((d / "port").read_text().strip())
    except (OSError, ValueError):
        return None


# --------------------------------------------------------------------------- commands


def cmd_serve(args) -> int:
    d = session_dir(args.session)
    if args.round:
        write_json(d / "round.json", json.loads(Path(args.round).read_text("utf-8")))
    if args.fresh:
        write_json(d / "answers.json", {})
        write_json(d / "working.json", [])
        (d / "events.jsonl").unlink(missing_ok=True)
    if not (WEB / "index.html").is_file():
        print("ask: web/ is missing — run `npm install && npm run build` in ui/", file=sys.stderr)
        return 1
    port = args.port or free_port()
    (d / "port").write_text(str(port))
    stop = threading.Event()
    hub = Hub()
    server = ThreadingHTTPServer(("127.0.0.1", port), make_handler(d, hub, stop))
    url = f"http://127.0.0.1:{port}/"
    print(f"ask: {args.session} at {url}", flush=True)
    if not args.no_open:
        webbrowser.open(url)
    try:
        server.serve_forever(poll_interval=0.2)
    except KeyboardInterrupt:
        pass
    finally:
        stop.set()
        (d / "port").unlink(missing_ok=True)
    print("ask: closed", flush=True)
    return 0


def cmd_push(args) -> int:
    d = session_dir(args.session)
    payload = json.loads(Path(args.payload).read_text("utf-8")) if args.payload != "-" \
        else json.loads(sys.stdin.read())
    write_json(d / "round.json", merge_round(read_json(d / "round.json", {}), payload))

    touched = {q["id"] for q in payload.get("questions", []) if "id" in q}
    touched |= set(payload.get("notes", {}))
    if touched:
        working = [qid for qid in read_json(d / "working.json", []) if qid not in touched]
        write_json(d / "working.json", working)
    port = running_port(d)
    live = post(port, "/api/refresh") if port else False
    print(json.dumps({"pushed": True, "live": live}, ensure_ascii=False))
    return 0


def cmd_wait(args) -> int:
    d = session_dir(args.session)
    since = args.since if args.since is not None else len(read_events(d))
    deadline = time.time() + args.timeout if args.timeout else None
    kinds = set(args.types.split(",")) if args.types else None
    while True:
        events = read_events(d)
        fresh = [e for e in events[since:] if not kinds or e.get("type") in kinds]
        if fresh:
            print(json.dumps({"events": fresh, "seq": len(events),
                              "answers": read_json(d / "answers.json", {})},
                             ensure_ascii=False, indent=2))
            return 0
        if deadline and time.time() > deadline:
            print(json.dumps({"events": [], "seq": len(events), "timeout": True}))
            return 0
        if running_port(d) is None and not args.detached:
            print(json.dumps({"events": [], "seq": len(events), "closed": True}))
            return 0
        time.sleep(0.2)


def cmd_answers(args) -> int:
    d = session_dir(args.session)
    print(json.dumps({"answers": read_json(d / "answers.json", {}),
                      "events": read_events(d)}, ensure_ascii=False, indent=2))
    return 0


def cmd_close(args) -> int:
    d = session_dir(args.session)
    port = running_port(d)
    print(json.dumps({"closed": bool(port and post(port, "/api/quit"))}))
    return 0


def main() -> int:
    p = argparse.ArgumentParser(prog="ask.py", description=__doc__.splitlines()[0])
    p.add_argument("--session", default="default", help="session name; picks the state directory")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("serve", help="hold the page (long-running)")
    s.add_argument("round", nargs="?", help="JSON file with the initial round")
    s.add_argument("--port", type=int, help="fixed port instead of a free one")
    s.add_argument("--no-open", action="store_true", help="do not open a browser")
    s.add_argument("--fresh", action="store_true", help="clear answers and events first")
    s.set_defaults(fn=cmd_serve)

    s = sub.add_parser("push", help="merge a payload into the round, live")
    s.add_argument("payload", help="JSON file, or - for stdin")
    s.set_defaults(fn=cmd_push)

    s = sub.add_parser("wait", help="block until the next event")
    s.add_argument("--since", type=int, help="event seq to start from (default: only new ones)")
    s.add_argument("--timeout", type=float, help="give up after this many seconds")
    s.add_argument("--types", help="comma-separated event types to wait for")
    s.add_argument("--detached", action="store_true", help="keep waiting even with no page up")
    s.set_defaults(fn=cmd_wait)

    s = sub.add_parser("answers", help="print answers and events")
    s.set_defaults(fn=cmd_answers)

    s = sub.add_parser("close", help="shut the page down")
    s.set_defaults(fn=cmd_close)

    args = p.parse_args()
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
