
import React, { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationAlert = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible && onClose) {
      const timer = setTimeout(() => onClose(), 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-primary text-primary-foreground shadow-2xl rounded-2xl p-4 flex items-start gap-4 border border-primary-foreground/10"
        >
          <div className="bg-primary-foreground/20 p-2 rounded-xl">
            <Bell className="w-6 h-6" />
          </div>
          <div className="flex-1 pt-1">
            <h4 className="font-bold text-lg leading-tight mb-1">Attention Required</h4>
            <p className="text-sm text-primary-foreground/90">{message}</p>
          </div>
          <button onClick={onClose} className="p-2 opacity-70 hover:opacity-100 transition-opacity">
            &times;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
