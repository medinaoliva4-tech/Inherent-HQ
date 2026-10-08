#!/bin/bash
# Limpia el sonido natural de un render y genera dos versiones:
#   <out>.mp4           sonido natural limpio (zumbido reducido, ventanas silenciadas, -20 LUFS, pico -2 dBTP)
#   <out>_sin-audio.mp4 solo imagen, para montar música en Instagram/TikTok
# Uso: finish_audio.sh raw.mp4 out_base "a1-b1 a2-b2 ..."   (ventanas a silenciar, en segundos; "" = ninguna)
set -e
RAW="$1"; OUT="$2"; MUTES="$3"
GAIN="1"
for w in $MUTES; do a=${w%-*}; b=${w#*-}; GAIN="$GAIN*clip(max($a-t\,t-$b)/0.12\,0\,1)"; done
PRE="highpass=f=110,afftdn=nr=20:nf=-48:tn=1,lowpass=f=12000,volume='$GAIN':eval=frame"
# Loudnorm en dos pasadas: primero se mide, después se aplica en modo lineal (llega al objetivo sin bombeo).
M=$(ffmpeg -hide_banner -nostats -i "$RAW" -map 0:a -af "$PRE,loudnorm=I=-20:TP=-2:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
mi=$(echo "$M" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_i'])")
mtp=$(echo "$M" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_tp'])")
mlra=$(echo "$M" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_lra'])")
mth=$(echo "$M" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_thresh'])")
off=$(echo "$M" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['target_offset'])")
FILT="$PRE,loudnorm=I=-20:TP=-2:LRA=11:measured_I=$mi:measured_TP=$mtp:measured_LRA=$mlra:measured_thresh=$mth:offset=$off:linear=true"
ffmpeg -v error -y -i "$RAW" -map 0:v -map 0:a -c:v copy -af "$FILT" -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT.mp4"
ffmpeg -v error -y -i "$RAW" -map 0:v -c:v copy -an -movflags +faststart "${OUT}_sin-audio.mp4"
ffmpeg -hide_banner -nostats -i "$OUT.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | head -3
