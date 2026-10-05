#!/usr/bin/env bash
set -euo pipefail
# Cut the qefyr 9:16 reel (13 s) from three generated shots — see docs/05-qefyr-reel.md.
# Shots: $SHOTS/shot1.mp4 (hook, 2 s), shot2.mp4 (pour, 6 s), shot3.mp4 (hero, 5 s).
# A missing shot is replaced by a labelled placeholder, so the edit can be checked early.
# Loop: the last LOOP_XF seconds of shot 3 dissolve into the frames that precede
# shot 1's in-point, so the last frame flows straight into the first one.
# Run: bash scripts/build_qefyr_reel.sh   (overrides via env, e.g. SHOT1_IN=1.2)
cd "$(dirname "$0")/.."

SHOTS=${SHOTS:-build/qefyr-reel/shots}
OUT=${OUT:-build/qefyr-reel/qefyr-reel-1080x1920.mp4}
LOGO=${LOGO:-docs/assets/qefyr/logo.png}
REFERENCE=${REFERENCE:-docs/assets/qefyr/qefyr.jpg}
HOOK=${HOOK:-Das hier lebt.}
D1=${D1:-2} D2=${D2:-6} D3=${D3:-5}
SHOT1_IN=${SHOT1_IN:-0.6} SHOT2_IN=${SHOT2_IN:-0} SHOT3_IN=${SHOT3_IN:-0}
LOOP_XF=${LOOP_XF:-0.5}
HOOK_END=${HOOK_END:-1.5} HOOK_SIZE=${HOOK_SIZE:-92}
LOGO_W=${LOGO_W:-300} LOGO_Y=${LOGO_Y:-1380}
W=1080 H=1920

if [[ -z "${FONT:-}" ]]; then
  for f in "$(fc-match -f '%{file}' 'FreeSerif' 2>/dev/null || true)" \
           /System/Library/Fonts/Supplemental/Times\ New\ Roman.ttf \
           /usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf; do
    [[ -n "$f" && -f "$f" ]] && FONT=$f && break
  done
fi
[[ -n "${FONT:-}" && -f "$FONT" ]] || { echo "set FONT=/path/to/serif.ttf" >&2; exit 1; }

calc() { awk "BEGIN { printf \"%.6f\", $1 }"; }
probe_fps() { ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$1"; }
probe_dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

mkdir -p "$(dirname "$OUT")" "$SHOTS"
PH=$(dirname "$OUT")/placeholders
mkdir -p "$PH"

placeholder() {  # $1 = shot number, $2 = duration, $3 = colour 0, $4 = colour 1
  local out=$PH/shot$1.mp4
  ffmpeg -y -loglevel error -f lavfi \
    -i "gradients=s=${W}x${H}:r=30:d=$2:c0=$3:c1=$4:speed=0.04:seed=$1" \
    -vf "drawtext=fontfile='$FONT':text='placeholder shot $1   src %{pts}':fontsize=34:fontcolor=white@0.7:x=40:y=60" \
    -c:v libx264 -pix_fmt yuv420p "$out"
  echo "$out"
}

shot() {  # $1 = shot number -> path of the real shot, or a placeholder
  local f=$SHOTS/shot$1.mp4
  if [[ -f "$f" ]]; then echo "$f"; return; fi
  echo "shot$1.mp4 missing in $SHOTS - using placeholder" >&2
  case $1 in
    1) placeholder 1 4 0x05080c 0x22313d ;;
    2) placeholder 2 7 0x2b1a0c 0xc9a27a ;;
    3) ffmpeg -y -loglevel error -loop 1 -framerate 30 -t 5 -i "$REFERENCE" \
         -vf "scale=2160:3840,zoompan=z='1+0.10*on/150':d=1:x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':s=${W}x${H}:fps=30" \
         -c:v libx264 -pix_fmt yuv420p "$PH/shot3.mp4"
       echo "$PH/shot3.mp4" ;;
  esac
}

S1=$(shot 1) S2=$(shot 2) S3=$(shot 3)

check_len() {  # $1 = file, $2 = in-point, $3 = duration
  if awk "BEGIN { exit !($(probe_dur "$1") + 0.001 < $2 + $3) }"; then
    echo "warning: $1 is shorter than in-point + $3 s - last frame is held" >&2
  fi
}
check_len "$S1" "$SHOT1_IN" "$D1"
check_len "$S2" "$SHOT2_IN" "$D2"
check_len "$S3" "$SHOT3_IN" "$D3"

# Keep the generators' native frame rate when all shots share one (no 24->30 judder).
F1=$(probe_fps "$S1") F2=$(probe_fps "$S2") F3=$(probe_fps "$S3")
FPS=${FPS:-$([[ "$F1" == "$F2" && "$F2" == "$F3" ]] && echo "$F1" || echo 30)}
FRAME=$(calc "1 / ($FPS)")

TOTAL=$(calc "$D1 + $D2 + $D3")
PRE=$(calc "$LOOP_XF + $FRAME")             # one extra frame: the last frame is 100 % pre-roll
XF_AT=$(calc "$D3 - $PRE")                  # dissolve start inside shot 3
TAIL=$(calc "$TOTAL - $PRE")                # dissolve start on the final timeline
S3_START=$(calc "$D1 + $D2")
HOOK_FADE=0.25

NORM="scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos:out_color_matrix=bt709,crop=${W}:${H},setsar=1,fps=${FPS},format=yuv420p"
seg() {  # $1 = in-point, $2 = duration
  echo "trim=start=$1:duration=$2,setpts=PTS-STARTPTS,$NORM,tpad=stop_mode=clone:stop_duration=$2,trim=duration=$2"
}

if awk "BEGIN { exit !($SHOT1_IN >= $PRE) }"; then
  PREROLL="trim=start=$(calc "$SHOT1_IN - $PRE"):duration=$PRE,setpts=PTS-STARTPTS,$NORM"
else
  echo "warning: SHOT1_IN < ${PRE}s - loop dissolves into a still of shot 1" >&2
  PREROLL="trim=start=$SHOT1_IN,setpts=PTS-STARTPTS,$NORM,trim=end_frame=1,tpad=stop_mode=clone:stop_duration=$PRE"
fi

HOOK_FILE=$(mktemp)
trap 'rm -f "$HOOK_FILE"' EXIT
printf '%s' "$HOOK" >"$HOOK_FILE"
# Hook: full from 0 s, fades out until HOOK_END; fades back in with the loop dissolve
# so the last frame matches the first.
HOOK_ALPHA="if(lt(t,$HOOK_END),min(1,($HOOK_END-t)/$HOOK_FADE),if(gt(t,$TAIL),min(1,(t-$TAIL)/$LOOP_XF),0))"

ffmpeg -y -loglevel error -stats \
  -i "$S1" -i "$S2" -i "$S3" \
  -loop 1 -framerate "$FPS" -t "$TOTAL" -i "$LOGO" \
  -f lavfi -t "$TOTAL" -i anullsrc=r=48000:cl=stereo \
  -filter_complex "
    [0:v]split[a][b];
    [a]$(seg "$SHOT1_IN" "$D1")[s1];
    [b]$PREROLL[pre];
    [1:v]$(seg "$SHOT2_IN" "$D2")[s2];
    [2:v]$(seg "$SHOT3_IN" "$D3")[s3];
    [s3][pre]xfade=transition=fade:duration=$LOOP_XF:offset=$XF_AT[s3loop];
    [s1][s2][s3loop]concat=n=3:v=1:a=0,
      drawtext=fontfile='$FONT':textfile='$HOOK_FILE':fontsize=$HOOK_SIZE:fontcolor=white:shadowcolor=black@0.35:shadowx=0:shadowy=2:x=(w-text_w)/2:y=(h-text_h)/2:alpha='$HOOK_ALPHA'[cut];
    [3:v]scale=${LOGO_W}:-1:flags=lanczos,format=rgba,
      fade=t=in:st=$(calc "$S3_START + 0.4"):d=0.6:alpha=1,fade=t=out:st=$TAIL:d=$LOOP_XF:alpha=1[logo];
    [cut][logo]overlay=x=(W-w)/2:y=$LOGO_Y:enable='gte(t,$S3_START)',format=yuv420p[v]" \
  -map '[v]' -map 4:a -t "$TOTAL" \
  -c:v libx264 -preset slow -crf 17 -profile:v high -level:v 4.1 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -tag:v avc1 \
  -c:a aac -b:a 128k -movflags +faststart "$OUT"

echo "$OUT"
