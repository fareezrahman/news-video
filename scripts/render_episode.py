#!/usr/bin/env python3
"""Render one episode.

Usage: scripts/render_episode.py episodes/<id>.json

Expects voice files at public/<id>/seg0.mp3, seg1.mp3, ... (one per segment, in order).
Sets each segment's audio + durationSec from the real file length so captions and scenes
match the speech, renders the video, then makes a phone-sized copy.
Output: out/<id>.mp4 and out/<id>_phone.mp4
"""
import json, os, pathlib, subprocess, sys, tempfile

root = pathlib.Path(__file__).resolve().parent.parent
ep_path = pathlib.Path(sys.argv[1]).resolve()
data = json.loads(ep_path.read_text())
ep_id = data["id"]

for i, seg in enumerate(data["segments"]):
    f = root / "public" / ep_id / f"seg{i}.mp3"
    if not f.exists():
        sys.exit(f"missing voice file: {f}")
    secs = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)]).decode().strip())
    seg["audio"] = f"{ep_id}/seg{i}.mp3"
    seg["durationSec"] = round(secs, 2)

out = root / "out"
out.mkdir(exist_ok=True)
with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as t:
    json.dump({"data": data}, t, ensure_ascii=False)
    props = t.name

full, phone = out / f"{ep_id}.mp4", out / f"{ep_id}_phone.mp4"
browser = os.environ.get("REMOTION_BROWSER")
cmd = ["npx", "remotion", "render", "src/index.ts", "Glance", str(full), f"--props={props}"]
if browser:
    cmd.append(f"--browser-executable={browser}")
subprocess.check_call(cmd, cwd=root)
subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", str(full), "-c:v", "libx264", "-preset", "veryfast",
    "-crf", "24", "-maxrate", "6M", "-bufsize", "12M", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "128k", str(phone)])
print(f"done: {phone}")
