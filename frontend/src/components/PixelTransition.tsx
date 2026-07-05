import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PixelTransitionProps {
  children: React.ReactNode;
  trigger?: any; // Re-run transition when this value changes
  gridSize?: number; // Size of grid, e.g. 10 means 10x10 squares
}

export const PixelTransition: React.FC<PixelTransitionProps> = ({
  children,
  trigger,
  gridSize = 10
}) => {
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 850); // Total transition animation time

    return () => clearTimeout(timer);
  }, [trigger]);

  // Generate grid indices
  const totalPixels = gridSize * gridSize;
  const pixels = Array.from({ length: totalPixels }, (_, i) => i);

  // Randomize order of pixels for a scattered dissolve effect
  const [randomizedOrder, setRandomizedOrder] = useState<number[]>([]);
  
  useEffect(() => {
    const arr = [...pixels];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setRandomizedOrder(arr);
  }, []);

  return (
    <div className="relative overflow-hidden w-full h-full">
      {/* Content wrapper */}
      <div className="w-full h-full">
        {children}
      </div>

      {/* Grid overlay for transition */}
      <AnimatePresence>
        {isTransitioning && randomizedOrder.length > 0 && (
          <div 
            className="absolute inset-0 z-50 pointer-events-none grid"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`
            }}
          >
            {pixels.map((index) => {
              const orderIndex = randomizedOrder.indexOf(index);
              // Calculate a staggered delay based on randomized index
              const delay = (orderIndex / totalPixels) * 0.45;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 1, scale: 1.05 }}
                  animate={{ opacity: 0, scale: 0 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: delay,
                    ease: [0.33, 1, 0.68, 1] // Ease-out cubic
                  }}
                  className="bg-background border-[0.5px] border-border/5"
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
