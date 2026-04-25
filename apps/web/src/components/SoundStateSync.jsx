
import React, { useEffect } from 'react';

export default function SoundStateSync() {
  useEffect(() => {
    // Check localStorage on mount
    const isSoundEnabled = localStorage.getItem('soundEnabled') === 'true';
    
    if (isSoundEnabled) {
      // Initialize Web Speech API voices
      if ('speechSynthesis' in window) {
        // Calling getVoices() triggers voice loading in some browsers
        window.speechSynthesis.getVoices();
        
        // Chrome requires an explicit synth call to fully bind sometimes, 
        // but we can't play sound without user interaction.
        // Getting voices is usually enough to prime the engine.
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    } else {
      // Ensure sound is disabled if needed (cancel any hanging speech)
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, []);

  return null; // Utility component, renders nothing
}
