import React from 'react';
import { motion } from 'framer-motion';

interface CurvedLoopProps {
  items: string[];
  speed?: number; // lower is faster
  reverse?: boolean;
}

export const CurvedLoop: React.FC<CurvedLoopProps> = ({ 
  items, 
  speed = 25, 
  reverse = false 
}) => {
  // Duplicate items to ensure smooth continuous looping
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className="w-full overflow-hidden py-3 bg-card border-y border-border relative select-none">
      {/* Soft gradient edge overlays for fade effect */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <motion.div 
        className="flex gap-16 items-center whitespace-nowrap"
        animate={{ 
          x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] 
        }}
        transition={{ 
          ease: 'linear', 
          duration: speed, 
          repeat: Infinity 
        }}
      >
        {duplicatedItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-display font-semibold text-xs sm:text-sm text-slate-350 tracking-wider uppercase">
              {item}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
