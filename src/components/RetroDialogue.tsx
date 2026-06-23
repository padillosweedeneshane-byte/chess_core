import React, { useState, useEffect } from "react";
import { playSound } from "../utils/sound";

interface RetroDialogueProps {
  text: string;
  speed?: number; // ms per char
  onComplete?: () => void;
  soundsEnabled?: boolean;
}

export const RetroDialogue: React.FC<RetroDialogueProps> = ({
  text,
  speed = 25,
  onComplete,
  soundsEnabled = true
}) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    // Reset state when text changes
    setDisplayedText("");
    if (!text) return;

    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      
      // Play a little 8-bit text typing beep/click every other character
      if (soundsEnabled && index % 2 === 0) {
        playSound("click");
      }

      index++;
      if (index >= text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete, soundsEnabled]);

  return (
    <div className="font-retro text-[8px] leading-[14px] md:text-[10px] md:leading-[18px] text-white select-all">
      {displayedText}
      <span className="inline-block w-1.5 h-3 bg-white ml-0.5 animate-pulse" />
    </div>
  );
};
