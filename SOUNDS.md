# Sound Effects Guide

## Required Sound Files

Place these in `client/public/sounds/`:

| File | Description | Duration | Source Suggestion |
|------|-------------|----------|-------------------|
| `spin-start.mp3` | Lever pull / button press | 0.3-0.5s | Mechanical click + whoosh |
| `reel-spinning.mp3` | Spinning loop | 1-2s (loops) | Fast ticking/clicking |
| `reel-stop.mp3` | Single reel stopping | 0.2-0.3s | Mechanical thunk |
| `win-small.mp3` | Small win (<5x) | 1s | Quick coin clink |
| `win-medium.mp3` | Medium win (5-15x) | 2s | Coin cascade |
| `win-big.mp3` | Big win (15-50x) | 3s | Fanfare + coins |
| `win-mega.mp3` | Mega win (50x+) | 4-5s | Epic celebration |
| `free-spins-trigger.mp3` | Free spins awarded | 2-3s | Magical shimmer |
| `free-spin-loop.mp3` | Background during free spins | 10-30s (loops) | Upbeat music |
| `hold-spin-trigger.mp3` | Hold & Spin activated | 2s | Electric/dramatic |
| `hold-spin-land.mp3` | New H&S symbol lands | 0.5s | Locking click |
| `jackpot-win.mp3` | Jackpot won | 5-8s | Massive celebration |
| `button-click.mp3` | UI button press | 0.1s | Soft click |
| `coin-insert.mp3` | Adding credits | 0.5s | Coin drop |

## Free Sound Resources

### Freesound.org (Free, requires attribution)
- Search "slot machine" "casino" "coin" "jackpot"
- Good packs:
  - https://freesound.org/search/?q=slot+machine
  - https://freesound.org/search/?q=casino+win

### Mixkit.co (Free, no attribution)
- https://mixkit.co/free-sound-effects/game/
- https://mixkit.co/free-sound-effects/casino/

### Zapsplat.com (Free with account)
- https://www.zapsplat.com/sound-effect-category/casino-and-slot-machines/

### Pixabay.com (Free, no attribution)
- https://pixabay.com/sound-effects/search/slot%20machine/
- https://pixabay.com/sound-effects/search/casino/

## Quick Download Commands

```bash
# After downloading, convert to mp3 if needed:
ffmpeg -i input.wav -codec:a libmp3lame -qscale:a 2 output.mp3

# Trim/normalize:
ffmpeg -i input.mp3 -ss 0 -t 2 -af "loudnorm=I=-16:TP=-1.5:LRA=11" output.mp3

# Make loop seamless:
ffmpeg -i input.mp3 -af "afade=t=in:st=0:d=0.1,afade=t=out:st=1.9:d=0.1" output.mp3
```

## Testing

Once sounds are added, refresh the game and spin. Check browser console for any loading errors.

The game will work without sounds (errors are silently caught), but you'll see warnings in console for missing files.
