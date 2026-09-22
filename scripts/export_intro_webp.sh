#!/usr/bin/env bash
set -euo pipefail
# Preserve the approved photo-derived pen animation; change only its container.
# A single-play animated image needs no media autoplay permission on iOS.
cd "$(dirname "$0")/.."
ffmpeg -y -loglevel error -i dist/assets/intro-handwriting-split.mp4 \
  -vf 'fps=30' -c:v libwebp_anim -lossless 1 -compression_level 6 -loop 1 \
  dist/assets/intro-handwriting-split.webp
