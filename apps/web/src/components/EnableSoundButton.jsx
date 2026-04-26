
import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils.js';

export default function EnableSoundButton({ compact = false, className = '' }) {
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const isEnabled = localStorage.getItem('soundEnabled') === 'true';
    setSoundEnabled(isEnabled);
  }, []);

  const handleEnableSound = () => {
    if (soundEnabled) return;

    if ('speechSynthesis' in window) {
      // Force init voices
      window.speechSynthesis.getVoices();
    }
    
    // Attempt dummy audio context init
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        ctx.resume();
      }
    } catch(e) {
      // Ignore
    }

    localStorage.setItem('soundEnabled', 'true');
    setSoundEnabled(true);
  };

  return (
    <Button
      onClick={handleEnableSound}
      disabled={soundEnabled}
      className={cn(
        `font-bold transition-all duration-300 ${
          compact ? 'h-11 px-5 text-sm rounded-2xl shadow-sm' : 'h-14 px-8 text-lg rounded-xl shadow-lg'
        } ${
        soundEnabled 
          ? 'bg-green-600 hover:bg-green-600 text-white opacity-100 cursor-default' 
          : 'bg-white text-slate-900 hover:bg-gray-100 shadow-white/20 interactive-element'
        }`,
        className
      )}
    >
      {soundEnabled ? (
        <>
          <Volume2 className={compact ? 'w-4 h-4 mr-1.5' : 'w-5 h-5 mr-3'} />
          {compact ? 'Sound On' : 'Sound: ON'}
        </>
      ) : (
        <>
          <VolumeX className={compact ? 'w-4 h-4 mr-1.5 text-slate-400' : 'w-5 h-5 mr-3 text-slate-400'} />
          Enable Sound
        </>
      )}
    </Button>
  );
}
