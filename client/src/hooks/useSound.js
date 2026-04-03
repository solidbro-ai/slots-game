/**
 * Sound Effects Hook
 * Manages all game audio with preloading and volume control
 */

import { useRef, useEffect, useCallback } from 'react';

// Sound definitions
const SOUNDS = {
  // Core gameplay
  spinStart: '/sounds/spin-start.mp3',
  reelSpin: '/sounds/reel-spinning.mp3',
  reelStop: '/sounds/reel-stop.mp3',
  
  // Wins
  winSmall: '/sounds/win-small.mp3',
  winMedium: '/sounds/win-medium.mp3',
  winBig: '/sounds/win-big.mp3',
  winMega: '/sounds/win-mega.mp3',
  
  // Features
  freeSpinsTrigger: '/sounds/free-spins-trigger.mp3',
  freeSpinLoop: '/sounds/free-spin-loop.mp3',
  holdSpinTrigger: '/sounds/hold-spin-trigger.mp3',
  holdSpinLand: '/sounds/hold-spin-land.mp3',
  jackpotWin: '/sounds/jackpot-win.mp3',
  
  // UI
  buttonClick: '/sounds/button-click.mp3',
  coinInsert: '/sounds/coin-insert.mp3',
};

// Volume levels for different sound types
const VOLUME_LEVELS = {
  spinStart: 0.5,
  reelSpin: 0.3,
  reelStop: 0.6,
  winSmall: 0.5,
  winMedium: 0.6,
  winBig: 0.7,
  winMega: 0.8,
  freeSpinsTrigger: 0.8,
  freeSpinLoop: 0.3,
  holdSpinTrigger: 0.8,
  holdSpinLand: 0.6,
  jackpotWin: 0.9,
  buttonClick: 0.3,
  coinInsert: 0.4,
};

export default function useSound() {
  const audioCache = useRef({});
  const loopingAudio = useRef(null);
  const masterVolume = useRef(1.0);
  const muted = useRef(false);

  // Preload all sounds on mount
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = (VOLUME_LEVELS[key] || 0.5) * masterVolume.current;
      audioCache.current[key] = audio;
    });

    return () => {
      // Cleanup
      Object.values(audioCache.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      if (loopingAudio.current) {
        loopingAudio.current.pause();
      }
    };
  }, []);

  // Play a sound effect
  const play = useCallback((soundName, options = {}) => {
    if (muted.current) return;
    
    const audio = audioCache.current[soundName];
    if (!audio) {
      console.warn(`Sound not found: ${soundName}`);
      return;
    }

    // Clone for overlapping plays
    const sound = options.allowOverlap ? audio.cloneNode() : audio;
    sound.volume = (VOLUME_LEVELS[soundName] || 0.5) * masterVolume.current * (options.volume || 1);
    sound.currentTime = 0;
    
    if (options.loop) {
      sound.loop = true;
      loopingAudio.current = sound;
    }

    sound.play().catch(err => {
      // Ignore autoplay restrictions
      if (err.name !== 'NotAllowedError') {
        console.warn(`Failed to play sound: ${soundName}`, err);
      }
    });

    return sound;
  }, []);

  // Stop looping audio
  const stopLoop = useCallback(() => {
    if (loopingAudio.current) {
      loopingAudio.current.pause();
      loopingAudio.current.currentTime = 0;
      loopingAudio.current = null;
    }
  }, []);

  // Play win sound based on multiplier
  const playWinSound = useCallback((winAmount, betAmount) => {
    const multiplier = winAmount / betAmount;
    
    if (multiplier >= 50) {
      play('winMega');
    } else if (multiplier >= 15) {
      play('winBig');
    } else if (multiplier >= 5) {
      play('winMedium');
    } else if (winAmount > 0) {
      play('winSmall');
    }
  }, [play]);

  // Play reel stop sounds with stagger (matches Reel.jsx timing)
  // Reels stop at: 800ms + (reelIndex * 200ms)
  const playReelStops = useCallback((reelCount = 5, initialDelay = 800, stagger = 200) => {
    for (let i = 0; i < reelCount; i++) {
      setTimeout(() => {
        play('reelStop', { allowOverlap: true });
      }, initialDelay + (i * stagger));
    }
  }, [play]);

  // Set master volume (0-1)
  const setVolume = useCallback((vol) => {
    masterVolume.current = Math.max(0, Math.min(1, vol));
    Object.entries(audioCache.current).forEach(([key, audio]) => {
      audio.volume = (VOLUME_LEVELS[key] || 0.5) * masterVolume.current;
    });
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    muted.current = !muted.current;
    if (muted.current && loopingAudio.current) {
      loopingAudio.current.pause();
    }
    return muted.current;
  }, []);

  return {
    play,
    stopLoop,
    playWinSound,
    playReelStops,
    setVolume,
    toggleMute,
    sounds: Object.keys(SOUNDS),
  };
}
