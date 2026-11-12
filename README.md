# Daily news video (Remotion)

Renders a 1080x1920 TikTok news video from one episode file.

## Files
- `src/Episode.tsx` the motion template (hook, story cards, captions, outro)
- `src/Root.tsx` registers the composition
- `episodes/epN.json` one file per day: segments, captions, sources. Each segment has `audio` (path inside `public/`) and `durationSec` (must match the real audio length)

## Daily run
1. `npm install`
2. Write `episodes/<date>.json`, generate voice per segment, save to `public/<date>/segN.mp3`, set `audio` and `durationSec` from the real file length
3. `scripts/render_episode.py episodes/<id>.json   (reads voice files, renders, makes the phone copy)
4. Compress for phone: `ffmpeg -i out/episode.mp4 -c:v libx264 -preset veryfast -crf 24 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k out/episode_phone.mp4`

Needs ffmpeg and a Chromium/Chrome on the machine (see `remotion.config.ts`).
