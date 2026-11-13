#!/usr/bin/env python3
"""Give each caption word the time it is actually spoken.

Usage: scripts/align_captions.py episodes/<id>.json

Transcribes public/<id>/segN.mp3 with faster-whisper (word timestamps), aligns the
caption words to the spoken words (captions use digits, the voice says them as words,
so unmatched words are spread between matched neighbours), and writes `wordStarts`
(seconds, one per caption word) into each segment of the episode JSON.
"""
import difflib, json, pathlib, re, sys

from faster_whisper import WhisperModel

root = pathlib.Path(__file__).resolve().parent.parent
ep_path = pathlib.Path(sys.argv[1]).resolve()
data = json.loads(ep_path.read_text())
ep_id = data["id"]
model = WhisperModel("small", device="cpu", compute_type="int8")


def norm(w):
    return re.sub(r"[^0-9a-z]", "", w.lower())


def align(cap, spk):
    """DP alignment maximising fuzzy word similarity. Returns {cap_idx: spk_idx}."""
    n, m = len(cap), len(spk)
    sim = [[0.0] * m for _ in range(n)]
    for i in range(n):
        for j in range(m):
            if cap[i] and spk[j]:
                r = difflib.SequenceMatcher(None, cap[i], spk[j]).ratio()
                sim[i][j] = r if r >= 0.7 else 0.0
    dp = [[0.0] * (m + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        for j in range(m - 1, -1, -1):
            best = max(dp[i + 1][j], dp[i][j + 1])
            if sim[i][j]:
                best = max(best, sim[i][j] + dp[i + 1][j + 1])
            dp[i][j] = best
    pairs, i, j = {}, 0, 0
    while i < n and j < m:
        if sim[i][j] and dp[i][j] == sim[i][j] + dp[i + 1][j + 1]:
            pairs[i] = j; i += 1; j += 1
        elif dp[i][j] == dp[i + 1][j]:
            i += 1
        else:
            j += 1
    return pairs


for k, seg in enumerate(data["segments"]):
    audio = root / "public" / ep_id / f"seg{k}.mp3"
    segments, _ = model.transcribe(str(audio), language="ms", word_timestamps=True, vad_filter=False)
    words = [w for s in segments for w in s.words]
    cap_words = seg["caption"].split()
    if not words:
        print(f"seg{k}: no speech found, keeping estimated timing"); continue
    spk_t = [w.start for w in words]
    pairs = align([norm(w) for w in cap_words], [norm(w.word) for w in words])
    end = words[-1].end
    starts = [None] * len(cap_words)
    for ci, sj in pairs.items():
        starts[ci] = spk_t[sj]
    # fill gaps between anchors: start right after the previous anchor's spoken word
    anchors = sorted(pairs.items())
    i = 0
    while i < len(cap_words):
        if starts[i] is not None:
            i += 1; continue
        j = i
        while j < len(cap_words) and starts[j] is None:
            j += 1
        prev = [a for a in anchors if a[0] < i]
        nxt = [a for a in anchors if a[0] >= j]
        lo_w = prev[-1][1] + 1 if prev else 0
        hi_w = nxt[0][1] if nxt else len(words)
        t0 = spk_t[lo_w] if lo_w < len(words) else end
        t1 = spk_t[hi_w] if hi_w < len(words) else end
        if t1 <= t0:
            t1 = t0 + 0.25 * (j - i)
        for x in range(i, j):
            starts[x] = round(t0 + (t1 - t0) * (x - i) / (j - i), 3)
        i = j
    # keep strictly non-decreasing
    for x in range(1, len(starts)):
        starts[x] = max(starts[x], starts[x - 1])
    seg["wordStarts"] = [round(s, 3) for s in starts]
    print(f"seg{k}: {len(pairs)}/{len(cap_words)} caption words matched to speech")
    print("   heard:", " ".join(f"{w.word.strip()}@{w.start:.2f}" for w in words))
    print("   caps :", " ".join(f"{c}@{t:.2f}" for c, t in zip(cap_words, seg["wordStarts"])))

ep_path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
