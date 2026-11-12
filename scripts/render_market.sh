#!/usr/bin/env bash
# Usage: scripts/render_market.sh episodes/market-YYYY-MM-DD.json  -> out/<id>.mp4
set -e
cd "$(dirname "$0")/.."
ID=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['id'])" "$1")
python3 -c "import json,sys;json.dump({'data':json.load(open(sys.argv[1]))},open('/tmp/mprops.json','w'),ensure_ascii=False)" "$1"
mkdir -p out
EXTRA=""; [ -n "$REMOTION_BROWSER" ] && EXTRA="--browser-executable=$REMOTION_BROWSER"
npx remotion render src/index.ts Market "out/$ID.mp4" --props=/tmp/mprops.json $EXTRA
echo "done: out/$ID.mp4"
