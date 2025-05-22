import React, { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../lib/utils';

interface Token {
  name: string;
  symbol: string;
  mint: string;
  price: number;
  priceChange24h: number;
}

interface TickerBarProps {
  tokens: Token[];
  onTokenClick: (token: Token) => void;
}

export function TickerBar({ tokens, onTokenClick }: TickerBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const animate = () => {
      if (!containerRef.current) return;
      
      setPosition(prev => {
        const newPos = prev - 2;
        const containerWidth = containerRef.current?.offsetWidth || 0;
        const contentWidth = (containerRef.current?.firstChild as HTMLElement)?.offsetWidth || 0;
        
        if (newPos <= -contentWidth / 2) {
          return 0;
        }
        return newPos;
      });
    };

    const interval = setInterval(animate, 30);
    return () => clearInterval(interval);
  }, []);

  const displayTokens = [...tokens, ...tokens];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-12 bg-black/50 backdrop-blur-lg border-b-2 border-orange-500/30 z-50 overflow-hidden">
        <div ref={containerRef} className="h-full relative">
          <div 
            className="absolute top-0 flex items-center h-full whitespace-nowrap"
            style={{ transform: `translateX(${position}px)` }}
          >
            {displayTokens.map((token, i) => (
              <button
                key={`${token.mint}-${i}`}
                onClick={() => onTokenClick(token)}
                className="px-4 py-2 flex items-center space-x-3 hover:bg-orange-500/10 transition-colors"
              >
                <span className="font-medium text-white">{token.symbol}</span>
                <span className={`${token.priceChange24h >= 0 ? 'text-orange-500' : 'text-[#FF00FF]'}`}>
                  {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-12" />
    </>
  );
}