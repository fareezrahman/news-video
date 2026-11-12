# Glance: daily run playbook

Brand: **Glance** (TikTok news account). Language: **Bahasa Malaysia**, casual spoken style ("korang", "jom"). English content comes later, not now.
Goal: a ready-to-post vertical video every morning by about 7:30am Malaysia time (UTC+8). The owner (Fareez) checks and posts it from his phone.

## Steps
1. **Pick stories.** Search today's Malaysian news (RTM, Bernama, Utusan, Astro Awani, The Star, Malay Mail). Pick 3, max 4. A story is used only if 2 different outlets confirm it. Skip crime details, rumours and anything unverified. Hard-news mix: economy/cost of living first, then politics/world, then one lighter story.
2. **Write `episodes/<yyyy-mm-dd>.json`** (copy the structure of `episodes/ep1.json`; set `id` and `date`).
   - Hook (first 2-3 seconds): the single most surprising fact, as 1-3 big words plus a one-line sub.
   - Each story: 2-3 short sentences, then a line "Maksudnya untuk korang" (what it means for the viewer).
   - One data card per story (compare / stat / rank) using only numbers found in the sources.
   - Outro: a yes/no question to get comments.
   - Total spoken length about 45-55 seconds.
   - Write numbers as words in the voice script ("dua ribu", "tahun sembilan belas tujuh puluh empat"); the on-screen caption can use digits.
3. **Voice.** ElevenLabs, model `eleven_v4`, one generation per segment (generations_count 1). Save as `public/<id>/seg0.mp3`, `seg1.mp3`, ... in segment order. Voice: Ashraf `NHFTLozDZneDWyQjRGAO` (proposed default, owner to confirm). Check an estimate first; one episode is about 920 credits (Starter plan: 30k/month).
4. **Render inside the ElevenLabs sandbox** (`creative_execute_sandbox`). The cloud workspace cannot download ElevenLabs audio (elevenlabsusercontent.com and api.elevenlabs.io are blocked), so the final video is built where the audio lives.
   - Fonts: attach once per flow with `creative_attach_reference_file` from
     `https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf` and
     `https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf`
   - Copy `html/index.html`, `html/app.js` (check md5 after writing), `html/fonts.sandbox.css` (as fonts.css) and an `episode.js` (`window.EP=<episode json>;`) into `/workspace/glance/`, fonts into `/workspace/glance/fonts/`.
   - Measure each voice clip with ffprobe, set `durationSec`, pad each clip to ceil((dur+0.35)*30)/30 s, concat, loudnorm I=-14.
   - Each sandbox command is killed after 180 s, and render-html runs ~12 s per second of video. Use size=large and render in parallel pieces: 4 x 9 s pieces per command for the hook/first story, 6 x 4.5 s pieces for later scenes. Then concat pieces + audio, encode H.264 crf 22, faststart.
   - Check: frame count = total segment frames, loudness about -14 LUFS, both fonts load (probe page).
   - Local preview (cloud workspace): `chrome-headless-shell --screenshot ... html/index.html#t=<sec>`.
5. **Deliver** to the owner: the ElevenLabs flow node link of the final MP4 (opens on phone, download from there), plus the caption text, 3-5 hashtags and the source list.
6. **TikTok caption format:** one hook line, one line of context, "Sumber: <outlets>", hashtags. Remind the owner to switch on the AI-generated content label.

## Rules
- Never use news photos or video from outlets. Visuals are the template only.
- If fewer than 3 stories pass the 2-source check, say so and deliver a shorter episode rather than padding.
- Do not retry a failed ElevenLabs generation automatically; report it (retries cost credits).
