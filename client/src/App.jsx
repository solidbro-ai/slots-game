import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import SlotMachine from './components/SlotMachine';
import Controls from './components/Controls';
import WinDisplay from './components/WinDisplay';
import FeatureOverlay from './components/FeatureOverlay';
import FreeSpinsOverlay from './components/FreeSpinsOverlay';
import Header from './components/Header';
import JackpotDisplay from './components/JackpotDisplay';
import Paytable from './components/Paytable';
import useSound from './hooks/useSound';

export default function App() {
  // Sound effects
  const sound = useSound();
  const [credits, setCredits] = useState(1000);
  const [betPerLine, setBetPerLine] = useState(1);
  const [lines, setLines] = useState(25);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState(Array(5).fill([1, 2, 3]));
  const [wins, setWins] = useState([]);
  const [totalWin, setTotalWin] = useState(0);
  const [feature, setFeature] = useState(null);
  const [config, setConfig] = useState(null);
  const [jackpots, setJackpots] = useState({});

  // Feature state
  const [activeFeature, setActiveFeature] = useState(null);
  const [featureId, setFeatureId] = useState(null);
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState(0);
  const [freeSpinsWon, setFreeSpinsWon] = useState(0);
  const [freeSpinsTotalAwarded, setFreeSpinsTotalAwarded] = useState(0);
  const [showFreeSpinsIntro, setShowFreeSpinsIntro] = useState(false);
  
  // Auto-spin timer for free spins
  const autoSpinTimerRef = useRef(null);
  const featureBetRef = useRef({ betPerLine: 1, lines: 25 });

  // Load config, user, and jackpots on mount
  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setConfig);
    fetch('/api/user').then(r => r.json()).then(u => setCredits(u.credits));
    fetch('/api/jackpots').then(r => r.json()).then(setJackpots).catch(() => {});
  }, []);

  // Refresh jackpots periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/jackpots').then(r => r.json()).then(setJackpots).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup auto-spin timer
  useEffect(() => {
    return () => {
      if (autoSpinTimerRef.current) {
        clearTimeout(autoSpinTimerRef.current);
      }
    };
  }, []);

  // Auto-spin logic for free spins
  useEffect(() => {
    if (activeFeature === 'free_spins' && !isSpinning && freeSpinsRemaining > 0 && !showFreeSpinsIntro) {
      // Set up auto-spin after 2 seconds
      autoSpinTimerRef.current = setTimeout(() => {
        doFreeSpin();
      }, 2000);

      return () => {
        if (autoSpinTimerRef.current) {
          clearTimeout(autoSpinTimerRef.current);
        }
      };
    }
  }, [activeFeature, isSpinning, freeSpinsRemaining, showFreeSpinsIntro]);

  const doFreeSpin = useCallback(async () => {
    if (isSpinning || freeSpinsRemaining <= 0) return;

    // Cancel any pending auto-spin
    if (autoSpinTimerRef.current) {
      clearTimeout(autoSpinTimerRef.current);
    }

    const spinStartTime = Date.now();
    const REELS_DONE_MS = 1700; // Last reel stops at 1600ms + buffer
    const featureBet = featureBetRef.current.betPerLine * featureBetRef.current.lines;

    setIsSpinning(true);
    setWins([]);
    setTotalWin(0);

    // Play spin sounds - schedule reel stops immediately (matches animation timing)
    sound.play('spinStart');
    sound.play('reelSpin', { loop: true });
    sound.playReelStops(); // Will play at 800ms, 1000ms, 1200ms, 1400ms, 1600ms

    try {
      const res = await fetch('/api/spin/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          featureId, 
          betPerLine: featureBetRef.current.betPerLine, 
          lines: featureBetRef.current.lines 
        }),
      });
      const result = await res.json();

      // Handle errors (rate limit, invalid session, etc.)
      if (!res.ok) {
        console.warn('Free spin rejected:', result.error);
        sound.stopLoop();
        setIsSpinning(false);
        return;
      }

      // Calculate remaining time until reels finish
      const elapsed = Date.now() - spinStartTime;
      const remainingTime = Math.max(0, REELS_DONE_MS - elapsed);

      // Stop spin loop after last reel stops
      setTimeout(() => sound.stopLoop(), remainingTime);

      // Update reels immediately (they're still spinning visually)
      setReels(result.reels);
      setCredits(result.credits);
      setFreeSpinsRemaining(result.spinsRemaining);

      // Delay wins display until all reels have stopped
      setTimeout(() => {
        setWins(result.wins || []);
        setTotalWin(result.totalWin || 0);
        setFreeSpinsWon(prev => prev + result.totalWin);

        // Play win sound after wins are displayed
        if (result.totalWin > 0) {
          sound.playWinSound(result.totalWin, featureBet);
        }

        if (result.retriggered) {
          setFreeSpinsTotalAwarded(prev => prev + result.bonusSpins);
          sound.play('freeSpinsTrigger');
        }
      }, remainingTime + 100);

      if (result.featureComplete) {
        // Feature ended - delay until after wins shown
        setTimeout(() => {
          setActiveFeature(null);
          setFeatureId(null);
        }, remainingTime + 2000);
      }

      setIsSpinning(false);
    } catch (err) {
      console.error('Free spin error:', err);
      sound.stopLoop();
      setIsSpinning(false);
    }
  }, [isSpinning, freeSpinsRemaining, featureId, sound]);

  const spin = useCallback(async () => {
    if (isSpinning) return;

    // If in free spins, trigger manual spin (cancels auto-spin timer)
    if (activeFeature === 'free_spins') {
      doFreeSpin();
      return;
    }

    const totalBet = betPerLine * lines;
    if (credits < totalBet) {
      return;
    }

    const spinStartTime = Date.now();
    const REELS_DONE_MS = 1700; // Last reel stops at 1600ms + buffer
    
    setIsSpinning(true);
    setWins([]);
    setTotalWin(0);

    // Play spin sounds - schedule reel stops immediately (matches animation timing)
    sound.play('spinStart');
    sound.play('reelSpin', { loop: true });
    sound.playReelStops(); // Will play at 800ms, 1000ms, 1200ms, 1400ms, 1600ms

    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betPerLine, lines }),
      });
      const result = await res.json();

      // Handle errors (rate limit, invalid bet, etc.)
      if (!res.ok) {
        console.warn('Spin rejected:', result.error);
        sound.stopLoop();
        setIsSpinning(false);
        return;
      }

      // Calculate remaining time until reels finish
      const elapsed = Date.now() - spinStartTime;
      const remainingTime = Math.max(0, REELS_DONE_MS - elapsed);

      // Stop spin loop after last reel stops
      setTimeout(() => sound.stopLoop(), remainingTime);

      // Update reels immediately (they're still spinning visually)
      setReels(result.reels);
      setCredits(result.credits);

      // Delay wins display until all reels have stopped
      setTimeout(() => {
        setWins(result.wins || []);
        setTotalWin(result.totalWin || 0);
        
        // Play win sound after wins are displayed
        if (result.totalWin > 0) {
          sound.playWinSound(result.totalWin, totalBet);
        }
      }, remainingTime + 100); // Small buffer after reels stop

      // Handle feature triggers (after wins display)
      if (result.feature) {
        setTimeout(() => {
          setFeature(result.feature);
          // Play feature trigger sound
          if (result.feature.type === 'free_spins') {
            sound.play('freeSpinsTrigger');
          } else if (result.feature.type === 'hold_and_spin') {
            sound.play('holdSpinTrigger');
          }
        }, remainingTime + 500);
      }

      setIsSpinning(false);
    } catch (err) {
      console.error('Spin error:', err);
      sound.stopLoop();
      setIsSpinning(false);
    }
  }, [isSpinning, credits, betPerLine, lines, activeFeature, doFreeSpin, sound]);

  const startFeature = useCallback(() => {
    if (!feature) return;

    setActiveFeature(feature.type);
    setFeatureId(feature.id);

    if (feature.type === 'free_spins') {
      // Store the bet settings for free spins
      featureBetRef.current = { betPerLine, lines };
      setFreeSpinsRemaining(feature.spins);
      setFreeSpinsTotalAwarded(feature.spins);
      setFreeSpinsWon(0);
      
      // Play free spins background music
      sound.play('freeSpinLoop', { loop: true });
      
      // Show intro overlay
      setShowFreeSpinsIntro(true);
      setTimeout(() => {
        setShowFreeSpinsIntro(false);
      }, 2500); // Show for 2.5 seconds
    } else if (feature.type === 'hold_and_spin') {
      // Hold & spin trigger sound already played
    }

    setFeature(null);
  }, [feature, betPerLine, lines, sound]);

  const addCredits = async () => {
    sound.play('coinInsert');
    const res = await fetch('/api/user/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000 }),
    });
    const data = await res.json();
    setCredits(data.credits);
  };

  // Keyboard handler
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space' && !isSpinning) {
        e.preventDefault();
        spin();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [spin, isSpinning]);

  return (
    <div className="casino-container">
      <div className="bg-effects">
        <div className="spotlight spotlight-1" />
        <div className="spotlight spotlight-2" />
      </div>

      <Header credits={credits} onAddCredits={addCredits} onToggleMute={sound.toggleMute} />

      <JackpotDisplay jackpots={jackpots} betLevel={betPerLine} />

      <WinDisplay amount={totalWin} isActive={totalWin > 0} />

      <SlotMachine 
        reels={reels} 
        isSpinning={isSpinning}
        wins={wins}
      />

      <Controls
        betPerLine={betPerLine}
        setBetPerLine={setBetPerLine}
        lines={lines}
        setLines={setLines}
        onSpin={spin}
        isSpinning={isSpinning}
        disabled={credits < betPerLine * lines && !activeFeature}
        config={config}
        isFreeSpins={activeFeature === 'free_spins'}
      />

      {/* Free Spins Counter */}
      {activeFeature === 'free_spins' && !showFreeSpinsIntro && (
        <div className="free-spins-counter active">
          <div className="fs-label">FREE SPINS</div>
          <div className="fs-remaining">{freeSpinsRemaining}</div>
          <div className="fs-win">
            <span className="fs-win-label">WON: </span>
            <span className="fs-win-value">{freeSpinsWon.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Free Spins Intro Overlay */}
      <AnimatePresence>
        {showFreeSpinsIntro && (
          <FreeSpinsOverlay spins={freeSpinsTotalAwarded} />
        )}
      </AnimatePresence>

      {/* Feature Trigger Overlay */}
      <AnimatePresence>
        {feature && (
          <FeatureOverlay 
            feature={feature} 
            onStart={startFeature}
          />
        )}
      </AnimatePresence>

      {/* Paytable */}
      <Paytable betPerLine={betPerLine} />
    </div>
  );
}
