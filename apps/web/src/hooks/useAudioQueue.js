
import { useState, useEffect, useRef, useCallback } from 'react';

export const useAudioQueue = () => {
  const [queue, setQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioContextRef = useRef(null);
  const activeUtteranceRef = useRef(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const playBeep = useCallback(() => {
    return new Promise((resolve) => {
      try {
        if (!audioContextRef.current) initAudio();
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime); // 800Hz beep
        
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        
        setTimeout(resolve, 200); // Wait for beep duration
      } catch (e) {
        console.error('Audio beep failed:', e);
        resolve(); 
      }
    });
  }, [initAudio]);

  const playVoice = useCallback((text, lang) => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        resolve();
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.volume = 1;
      utterance.rate = 0.9;
      
      activeUtteranceRef.current = utterance;
      
      utterance.onend = () => {
        activeUtteranceRef.current = null;
        resolve();
      };
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        activeUtteranceRef.current = null;
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const cancelAnnouncement = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    activeUtteranceRef.current = null;
    setIsPlaying(false);
    setQueue([]);
  }, []);

  const playBeepAndAnnounce = useCallback((ticketNumber, counterNumber) => {
    if (!audioEnabled) return;
    
    const enText = `Ticket number ${ticketNumber}, please proceed to counter ${counterNumber}`;
    const arText = `التذكرة رقم ${ticketNumber}، يرجى التوجه إلى الكاونتر رقم ${counterNumber}`;
    
    setQueue(prev => [...prev, { enText, arText }]);
  }, [audioEnabled]);

  useEffect(() => {
    let active = true;

    const processQueue = async () => {
      if (queue.length > 0 && !isPlaying && audioEnabled) {
        setIsPlaying(true);
        const item = queue[0];

        try {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Cancel any lingering speech
          }

          // 1. Play Beep
          await playBeep();
          
          // 2. 800ms delay after beep completes
          await new Promise(r => setTimeout(r, 800));
          
          if (!active) return;
          
          // 3. Play English
          await playVoice(item.enText, 'en-US');
          
          // 4. Short padding between languages
          await new Promise(r => setTimeout(r, 400));
          
          if (!active) return;

          // 5. Play Arabic
          await playVoice(item.arText, 'ar-SA');
          
        } catch (e) {
          console.error('Error in audio processing', e);
        }
        
        if (active) {
          setQueue(prev => prev.slice(1));
          setIsPlaying(false);
        }
      }
    };

    processQueue();

    return () => {
      active = false;
    };
  }, [queue, isPlaying, audioEnabled, playBeep, playVoice]);

  return { 
    playBeepAndAnnounce, 
    cancelAnnouncement, 
    audioEnabled, 
    setAudioEnabled,
    initAudio
  };
};
