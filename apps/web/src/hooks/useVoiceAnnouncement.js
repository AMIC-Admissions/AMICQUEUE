import { useState, useCallback, useRef, useEffect } from 'react';

const ARABIC_CALL_PREFIX = '\u0646\u0631\u062c\u0648 \u0627\u0644\u0627\u0646\u062a\u0628\u0627\u0647. \u0627\u0644\u062a\u0630\u0643\u0631\u0629';
const ARABIC_CALL_SUFFIX = '\u064a\u0631\u062c\u0649 \u0627\u0644\u062a\u0648\u062c\u0647 \u0625\u0644\u0649 \u0627\u0644\u0643\u0627\u0648\u0646\u062a\u0631';

export const useVoiceAnnouncement = () => {
  const [voiceQueue, setVoiceQueue] = useState([]);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [lastAnnouncedTicket, setLastAnnouncedTicket] = useState(null);

  const processingRef = useRef(false);
  const queueRef = useRef([]);

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
        osc.frequency.setValueAtTime(1000, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);

        setTimeout(resolve, 250);
      } catch (error) {
        console.error('Beep error:', error);
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
        selectedVoice = voices.find((voice) => voice.lang.startsWith('ar'))
          || voices.find((voice) => voice.name.toLowerCase().includes('arabic'));
      } else {
        selectedVoice = voices.find((voice) => voice.lang === 'en-US' && voice.name.includes('Google'))
          || voices.find((voice) => voice.lang.startsWith('en'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (error) => {
        console.error(`Speech error (${lang}):`, error);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const announceTicket = useCallback(async (ticket) => {
    const ticketNum = ticket.ticketNumber;
    const counterNum = ticket.counter || ticket.counterNumber;

    if (!ticketNum || !counterNum) return;

    const enText = `Attention please. Ticket ${ticketNum}, please proceed to counter ${counterNum}.`;
    const arText = `${ARABIC_CALL_PREFIX} ${ticketNum} ${ARABIC_CALL_SUFFIX} ${counterNum}.`;

    for (let i = 0; i < 2; i += 1) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      await createBeepSound();
      await wait(800);

      await speakAnnouncement(enText, 'en-US');
      await wait(400);

      await speakAnnouncement(arText, 'ar-SA');
      await wait(1000);
    }
  }, [createBeepSound, speakAnnouncement]);

  const playNextAnnouncement = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return;

    processingRef.current = true;
    setIsPlayingVoice(true);

    try {
      const ticketToPlay = queueRef.current[0];
      await announceTicket(ticketToPlay);
      setVoiceQueue((prev) => prev.slice(1));
    } catch (error) {
      console.error('Error playing announcement:', error);
      setVoiceQueue((prev) => prev.slice(1));
    } finally {
      processingRef.current = false;
      setIsPlayingVoice(false);

      if (queueRef.current.length > 1) {
        setTimeout(() => playNextAnnouncement(), 100);
      }
    }
  }, [announceTicket]);

  const addToVoiceQueue = useCallback((ticket) => {
    if (!ticket || !ticket.ticketNumber || (!ticket.counter && !ticket.counterNumber)) return;

    setLastAnnouncedTicket((prev) => {
      if (prev && prev.id === ticket.id) return prev;

      setVoiceQueue((queue) => {
        if (queue.some((queuedTicket) => queuedTicket.id === ticket.id)) return queue;
        return [...queue, ticket];
      });

      return ticket;
    });
  }, []);

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
