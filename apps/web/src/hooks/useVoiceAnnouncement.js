
import { useState, useCallback, useRef, useEffect } from 'react';

export const useVoiceAnnouncement = () => {
  const [voiceQueue, setVoiceQueue] = useState([]);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [lastAnnouncedTicket, setLastAnnouncedTicket] = useState(null);
  
  const processingRef = useRef(false);
  const queueRef = useRef([]);

  // Sync ref with state
  useEffect(() => {
    queueRef.current = voiceQueue;
  }, [voiceQueue]);

  const createBeepSound = useCallback(() => {
    return new Promise((resolve) => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          resolve();
          return;
        }
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime); // 1000Hz
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime); // 0.3 volume
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2); // 200ms duration
        
        // Resolve after the beep finishes
        setTimeout(resolve, 250);
      } catch (e) {
        console.error('Beep error:', e);
        resolve();
      }
    });
  }, []);

  const speakAnnouncement = useCallback((text, lang) => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;
      
      if (lang === 'ar-SA') {
        selectedVoice = voices.find(v => v.lang.startsWith('ar')) || voices.find(v => v.name.toLowerCase().includes('arabic'));
      } else {
        selectedVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.error(`Speech error (${lang}):`, e);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const announceTicket = useCallback(async (ticket) => {
    const ticketNum = ticket.ticketNumber;
    const counterNum = ticket.counter || ticket.counterNumber;
    
    if (!ticketNum || !counterNum) return;

    const enText = `Attention please. Ticket ${ticketNum}, please proceed to counter ${counterNum}.`;
    const arText = `نرجو الانتباه. التذكرة ${ticketNum} يرجى التوجه إلى الكاونتر ${counterNum}.`;

    for (let i = 0; i < 2; i++) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // ensure clear buffer
      }
      
      await createBeepSound();
      await wait(800);
      
      await speakAnnouncement(enText, 'en-US');
      await wait(400); // slight pause between languages
      
      await speakAnnouncement(arText, 'ar-SA');
      await wait(1000); // pause before potential repetition
    }
  }, [createBeepSound, speakAnnouncement]);

  const playNextAnnouncement = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return;
    
    processingRef.current = true;
    setIsPlayingVoice(true);

    try {
      const ticketToPlay = queueRef.current[0];
      await announceTicket(ticketToPlay);
      
      // Update queue state to remove the processed ticket
      setVoiceQueue(prev => prev.slice(1));
    } catch (error) {
      console.error('Error playing announcement:', error);
      setVoiceQueue(prev => prev.slice(1));
    } finally {
      processingRef.current = false;
      setIsPlayingVoice(false);
      
      // Call recursively for next item if any
      if (queueRef.current.length > 1) { // 1 because state hasn't updated yet in this closure
        setTimeout(() => playNextAnnouncement(), 100);
      }
    }
  }, [announceTicket]);

  const addToVoiceQueue = useCallback((ticket) => {
    if (!ticket || !ticket.ticketNumber || (!ticket.counter && !ticket.counterNumber)) return;
    
    setLastAnnouncedTicket(prev => {
      // Check if this ticket is already the last one announced
      if (prev && prev.id === ticket.id) return prev;
      
      // Add to queue if different
      setVoiceQueue(q => {
        // Double check it's not already in the queue
        if (q.some(t => t.id === ticket.id)) return q;
        return [...q, ticket];
      });
      
      return ticket;
    });
  }, []);

  // Auto-start processing when items are added
  useEffect(() => {
    if (voiceQueue.length > 0 && !isPlayingVoice && !processingRef.current) {
      playNextAnnouncement();
    }
  }, [voiceQueue, isPlayingVoice, playNextAnnouncement]);

  const stopCurrentAnnouncement = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceQueue([]);
    processingRef.current = false;
    setIsPlayingVoice(false);
  }, []);

  const clearVoiceQueue = useCallback(() => {
    setVoiceQueue([]);
  }, []);

  return {
    voiceQueue,
    isPlayingVoice,
    lastAnnouncedTicket,
    addToVoiceQueue,
    playNextAnnouncement,
    stopCurrentAnnouncement,
    clearVoiceQueue
  };
};
