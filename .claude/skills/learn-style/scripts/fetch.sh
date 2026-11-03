#!/usr/bin/env bash
# Fetch one reference. If the platform blocks us, STOP and ask for the file --
# never substitute a different video.
#   fetch.sh <url-or-path> <outdir>
set -euo pipefail
SRC="${1:?url or local path}"; OUT="${2:?outdir}"
mkdir -p "$OUT"
DST="$OUT/source.mp4"
YTDLP="${YTDLP:-yt-dlp}"

if [ -f "$SRC" ]; then
  cp "$SRC" "$DST"; echo "copied local file -> $DST"; exit 0
fi
[ -f "$DST" ] && { echo "reusing $DST"; exit 0; }

set +e
"$YTDLP" -f "bv*[height<=1080]+ba/b[height<=1080]" --merge-output-format mp4 \
         --no-playlist ${COOKIES:+--cookies-from-browser "$COOKIES"} \
         -o "$DST" "$SRC" 2> "$OUT/fetch.log"
rc=$?
set -e

if [ $rc -ne 0 ] || [ ! -f "$DST" ]; then
  echo "FETCH FAILED for: $SRC"
  grep -iE "sign in|bot|403|429|private|members" "$OUT/fetch.log" | tail -3 || tail -3 "$OUT/fetch.log"
  cat <<'MSG'

  This platform is blocking automated download (common from datacenter IPs,
  and always for login-gated or private videos).

  ASK THE USER TO SUPPLY THE FILE. Do not swap in a different video, and do
  not ask them for account cookies -- sending those through a datacenter IP
  puts their account at risk.
MSG
  exit 2
fi
echo "downloaded -> $DST"
