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
4. **Render.** `scripts/render_episode.py episodes/<id>.json` (about 4 minutes). Look at 3-4 frames of the result before delivering: nothing cut off, captions readable, numbers match sources.
5. **Deliver** to the owner: `out/<id>_phone.mp4` (about 12 MB), plus the caption text, 3-5 hashtags and the source list.
6. **TikTok caption format:** one hook line, one line of context, "Sumber: <outlets>", hashtags. Remind the owner to switch on the AI-generated content label.

## Rules
- Never use news photos or video from outlets. Visuals are the template only.
- If fewer than 3 stories pass the 2-source check, say so and deliver a shorter episode rather than padding.
- Do not retry a failed ElevenLabs generation automatically; report it (retries cost credits).
