// Previous TickerBar.tsx content with updated colors
<span className={`${token.priceChange24h >= 0 ? 'text-orange-500' : 'text-[#FF4500]'}`}>
  {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
</span>