import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface HandoffOverlayProps {
  isVisible: boolean;
  insurerName: string;
}

const messages = [
  "Preparing your application...",
  "Filling in your details...",
  "Almost there..."
];

export function HandoffOverlay({ isVisible, insurerName }: HandoffOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0); // Reset when hidden
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="flex flex-col items-center max-w-sm w-full bg-white p-8 rounded-2xl shadow-xl text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-6" />
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Connecting to {insurerName}...
        </h3>
        
        <p className="text-gray-600 mb-6 min-h-[24px]">
          {messages[messageIndex]}
        </p>
        
        <p className="text-xs text-gray-400 mt-2">
          This usually takes 5–10 seconds
        </p>
      </div>
    </div>
  );
}
