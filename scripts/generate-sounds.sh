#!/bin/bash
# Generate placeholder casino sound effects using ffmpeg

OUT_DIR="../client/public/sounds"
mkdir -p "$OUT_DIR"

echo "🔊 Generating casino sound effects..."

# 1. Spin Start - mechanical clunk + whoosh
echo "  → spin-start.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=150:duration=0.05" \
  -f lavfi -i "sine=frequency=80:duration=0.1" \
  -f lavfi -i "anoisesrc=d=0.3:c=pink:a=0.3" \
  -filter_complex "[0][1]concat=n=2:v=0:a=1[click];[click][2]amix=inputs=2:duration=shortest[mix];[mix]lowpass=f=2000,highpass=f=50,afade=t=out:st=0.2:d=0.15[out]" \
  -map "[out]" -ar 44100 -ac 2 "$OUT_DIR/spin-start.mp3" 2>/dev/null

# 2. Reel Spinning - fast clicking loop
echo "  → reel-spinning.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=800:duration=0.02" -af "aloop=loop=50:size=882,volume=0.5,lowpass=f=3000" \
  -t 1.5 -ar 44100 -ac 2 "$OUT_DIR/reel-spinning.mp3" 2>/dev/null

# 3. Reel Stop - satisfying thunk
echo "  → reel-stop.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=120:duration=0.15" \
  -af "afade=t=out:st=0.05:d=0.1,lowpass=f=500,volume=2" \
  -ar 44100 -ac 2 "$OUT_DIR/reel-stop.mp3" 2>/dev/null

# 4. Win Small - quick coin clink
echo "  → win-small.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=2000:duration=0.1" \
  -f lavfi -i "sine=frequency=2500:duration=0.08" \
  -filter_complex "[0][1]amix=inputs=2[mix];[mix]afade=t=out:st=0.05:d=0.1,highpass=f=1000[out]" \
  -map "[out]" -ar 44100 -ac 2 "$OUT_DIR/win-small.mp3" 2>/dev/null

# 5. Win Medium - coin cascade
echo "  → win-medium.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=1800:duration=0.08" \
  -f lavfi -i "sine=frequency=2200:duration=0.08" \
  -f lavfi -i "sine=frequency=2600:duration=0.08" \
  -f lavfi -i "sine=frequency=2000:duration=0.08" \
  -f lavfi -i "sine=frequency=2400:duration=0.08" \
  -filter_complex "[0]adelay=0|0[d0];[1]adelay=150|150[d1];[2]adelay=300|300[d2];[3]adelay=450|450[d3];[4]adelay=600|600[d4];[d0][d1][d2][d3][d4]amix=inputs=5[mix];[mix]afade=t=out:st=0.5:d=0.3,highpass=f=800[out]" \
  -map "[out]" -t 1 -ar 44100 -ac 2 "$OUT_DIR/win-medium.mp3" 2>/dev/null

# 6. Win Big - fanfare
echo "  → win-big.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=523:duration=0.3" \
  -f lavfi -i "sine=frequency=659:duration=0.3" \
  -f lavfi -i "sine=frequency=784:duration=0.5" \
  -f lavfi -i "sine=frequency=1047:duration=0.8" \
  -filter_complex "[0]adelay=0|0[d0];[1]adelay=200|200[d1];[2]adelay=400|400[d2];[3]adelay=600|600[d3];[d0][d1][d2][d3]amix=inputs=4[mix];[mix]afade=t=in:st=0:d=0.1,afade=t=out:st=1.2:d=0.3[out]" \
  -map "[out]" -t 1.5 -ar 44100 -ac 2 "$OUT_DIR/win-big.mp3" 2>/dev/null

# 7. Win Mega - epic celebration
echo "  → win-mega.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=261:duration=0.4" \
  -f lavfi -i "sine=frequency=329:duration=0.4" \
  -f lavfi -i "sine=frequency=392:duration=0.4" \
  -f lavfi -i "sine=frequency=523:duration=0.6" \
  -f lavfi -i "sine=frequency=659:duration=0.6" \
  -f lavfi -i "sine=frequency=784:duration=1" \
  -f lavfi -i "sine=frequency=1047:duration=1.5" \
  -filter_complex "[0]adelay=0|0[d0];[1]adelay=0|0[d1];[2]adelay=0|0[d2];[3]adelay=400|400[d3];[4]adelay=400|400[d4];[5]adelay=800|800[d5];[6]adelay=1200|1200[d6];[d0][d1][d2][d3][d4][d5][d6]amix=inputs=7[mix];[mix]volume=0.7,afade=t=in:st=0:d=0.1,afade=t=out:st=2:d=0.5[out]" \
  -map "[out]" -t 2.5 -ar 44100 -ac 2 "$OUT_DIR/win-mega.mp3" 2>/dev/null

# 8. Free Spins Trigger - magical shimmer
echo "  → free-spins-trigger.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=880:duration=0.5" \
  -f lavfi -i "sine=frequency=1320:duration=0.5" \
  -f lavfi -i "sine=frequency=1760:duration=0.5" \
  -f lavfi -i "sine=frequency=2640:duration=0.8" \
  -filter_complex "[0]adelay=0|0,volume=0.3[d0];[1]adelay=100|100,volume=0.3[d1];[2]adelay=200|200,volume=0.3[d2];[3]adelay=300|300,volume=0.4[d3];[d0][d1][d2][d3]amix=inputs=4[mix];[mix]aecho=0.8:0.7:50:0.5,afade=t=out:st=0.8:d=0.4[out]" \
  -map "[out]" -t 1.5 -ar 44100 -ac 2 "$OUT_DIR/free-spins-trigger.mp3" 2>/dev/null

# 9. Free Spin Loop - upbeat background (simple arpeggiated pattern)
echo "  → free-spin-loop.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=0.2" \
  -f lavfi -i "sine=frequency=554:duration=0.2" \
  -f lavfi -i "sine=frequency=659:duration=0.2" \
  -f lavfi -i "sine=frequency=880:duration=0.2" \
  -filter_complex "[0]adelay=0|0[d0];[1]adelay=200|200[d1];[2]adelay=400|400[d2];[3]adelay=600|600[d3];[d0][d1][d2][d3]amix=inputs=4[mix];[mix]aloop=loop=12:size=35280,volume=0.4,afade=t=out:st=9.5:d=0.5[out]" \
  -map "[out]" -t 10 -ar 44100 -ac 2 "$OUT_DIR/free-spin-loop.mp3" 2>/dev/null

# 10. Hold & Spin Trigger - electric/dramatic
echo "  → hold-spin-trigger.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=100:duration=0.3" \
  -f lavfi -i "sine=frequency=150:duration=0.3" \
  -f lavfi -i "anoisesrc=d=0.5:c=white:a=0.2" \
  -filter_complex "[0][1]amix=inputs=2[bass];[bass][2]amix=inputs=2[mix];[mix]lowpass=f=800,tremolo=f=20:d=0.7,afade=t=in:st=0:d=0.1,afade=t=out:st=0.3:d=0.2[out]" \
  -map "[out]" -t 0.5 -ar 44100 -ac 2 "$OUT_DIR/hold-spin-trigger.mp3" 2>/dev/null

# 11. Hold & Spin Land - lock click
echo "  → hold-spin-land.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=600:duration=0.05" \
  -f lavfi -i "sine=frequency=300:duration=0.1" \
  -filter_complex "[0][1]concat=n=2:v=0:a=1[out];[out]afade=t=out:st=0.1:d=0.05" \
  -ar 44100 -ac 2 "$OUT_DIR/hold-spin-land.mp3" 2>/dev/null

# 12. Jackpot Win - massive celebration
echo "  → jackpot-win.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=261:duration=0.5" \
  -f lavfi -i "sine=frequency=329:duration=0.5" \
  -f lavfi -i "sine=frequency=392:duration=0.5" \
  -f lavfi -i "sine=frequency=523:duration=1" \
  -f lavfi -i "sine=frequency=659:duration=1" \
  -f lavfi -i "sine=frequency=784:duration=1" \
  -f lavfi -i "sine=frequency=1047:duration=2" \
  -f lavfi -i "sine=frequency=1318:duration=2" \
  -f lavfi -i "sine=frequency=1568:duration=2" \
  -filter_complex "[0]adelay=0|0[d0];[1]adelay=0|0[d1];[2]adelay=0|0[d2];[3]adelay=500|500[d3];[4]adelay=500|500[d4];[5]adelay=500|500[d5];[6]adelay=1000|1000[d6];[7]adelay=1000|1000[d7];[8]adelay=1000|1000[d8];[d0][d1][d2][d3][d4][d5][d6][d7][d8]amix=inputs=9[mix];[mix]volume=0.5,aecho=0.8:0.5:100:0.3,afade=t=in:st=0:d=0.2,afade=t=out:st=2.5:d=0.5[out]" \
  -map "[out]" -t 3 -ar 44100 -ac 2 "$OUT_DIR/jackpot-win.mp3" 2>/dev/null

# 13. Button Click - soft click
echo "  → button-click.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=1000:duration=0.03" \
  -af "afade=t=out:st=0.01:d=0.02,volume=0.5" \
  -ar 44100 -ac 2 "$OUT_DIR/button-click.mp3" 2>/dev/null

# 14. Coin Insert - coin drop
echo "  → coin-insert.mp3"
ffmpeg -y -f lavfi -i "sine=frequency=1500:duration=0.1" \
  -f lavfi -i "sine=frequency=2000:duration=0.08" \
  -f lavfi -i "sine=frequency=1200:duration=0.15" \
  -filter_complex "[0]adelay=0|0[d0];[1]adelay=100|100[d1];[2]adelay=180|180[d2];[d0][d1][d2]amix=inputs=3[mix];[mix]highpass=f=800,afade=t=out:st=0.2:d=0.1[out]" \
  -map "[out]" -t 0.4 -ar 44100 -ac 2 "$OUT_DIR/coin-insert.mp3" 2>/dev/null

echo ""
echo "✅ Generated $(ls -1 $OUT_DIR/*.mp3 2>/dev/null | wc -l | tr -d ' ') sound files in $OUT_DIR/"
ls -la "$OUT_DIR"/*.mp3 2>/dev/null
