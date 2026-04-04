import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface HandoffOverlayProps {
  isVisible: boolean;
  insurerName: string;
}

const messages = [
  "> preparing application...",
  "> filling in your details...",
  "> almost there..."
];

export function HandoffOverlay({ isVisible, insurerName }: HandoffOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="flex flex-col items-center max-w-sm w-full bg-card p-8 rounded-2xl shadow-xl border border-border text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />

        <h3 className="text-xl font-bold text-foreground mb-2">
          Connecting to {insurerName}...
        </h3>

        <p className="text-primary mb-6 min-h-[24px]">
          {messages[messageIndex]}
        </p>

        <p className="text-xs text-muted-foreground mt-2">
          This usually takes 5-10 seconds
        </p>
      </div>
    </div>
  );
}
