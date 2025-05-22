import React, { useState, useEffect } from 'react';
import { formatNumber, formatPrice, formatAddress } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ExternalLink, TrendingUp, DollarSign, Activity, AlertCircle } from 'lucide-react';

interface TokenData {
  name: string;
  symbol: string;
  mint: string;
  price: number;
  marketCap: number;
  priceChange24h: number;
}

interface TopTrader {
  wallet: string;
  total: number;
  realized: number;
  unrealized: number;
  winPercentage?: number;
}

interface TokenTableProps {
  tokens: TokenData[];
  topTraders: TopTrader[] | null;
  onWalletClick: (wallet: string) => void;
}

export function TokenTable({ tokens, topTraders: initialTopTraders, onWalletClick }: TokenTableProps) {
  const [selectedToken, setSelectedToken] = React.useState<TokenData | null>(null);
  const [topTraders, setTopTraders] = React.useState<TopTrader[]>(initialTopTraders || []);
  const [isLoadingTraders, setIsLoadingTraders] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleTokenClick = async (token: TokenData) => {
    setSelectedToken(token);
    setError(null);
    
    if (!initialTopTraders) {
      setIsLoadingTraders(true);
      try {
        const tradersResponse = await fetch(`https://data.solanatracker.io/top-traders/${token.mint}`, {
          headers: {
            'x-api-key': '7f9707ad-e94b-4a13-b7c9-65e48572c79b'
          }
        });

        if (!tradersResponse.ok) {
          throw new Error(`Failed to fetch top traders (${tradersResponse.status})`);
        }

        const tradersData = await tradersResponse.json();
        
        const traders = Array.isArray(tradersData) ? tradersData : (Array.isArray(tradersData.data) ? tradersData.data : []);
        
        if (traders.length === 0) {
          setTopTraders([]);
          return;
        }

        const tradersWithWinRate = await Promise.all(
          traders.slice(0, 20).map(async (trader: TopTrader) => {
            try {
              const pnlResponse = await fetch(`https://data.solanatracker.io/pnl/${trader.wallet}`, {
                headers: {
                  'x-api-key': '7f9707ad-e94b-4a13-b7c9-65e48572c79b'
                }
              });
              
              if (!pnlResponse.ok) {
                return {
                  ...trader,
                  winPercentage: 0
                };
              }

              const pnlData = await pnlResponse.json();
              if (!pnlData || !pnlData.summary) {
                return {
                  ...trader,
                  winPercentage: 0
                };
              }

              const totalTrades = (pnlData.summary.totalWins || 0) + (pnlData.summary.totalLosses || 0);
              const winPercentage = totalTrades > 0 
                ? (pnlData.summary.totalWins / totalTrades) * 100 
                : 0;

              return {
                ...trader,
                winPercentage,
                totalTrades
              };
            } catch (error) {
              console.warn(`Error fetching PNL for wallet ${trader.wallet}:`, error);
              return {
                ...trader,
                winPercentage: 0
              };
            }
          })
        );

        const activeTraders = tradersWithWinRate
          .filter(trader => (trader.totalTrades || 0) > 0)
          .sort((a, b) => (b.winPercentage || 0) - (a.winPercentage || 0));

        setTopTraders(activeTraders);
        setError(null);
      } catch (error) {
        console.error('Error fetching top traders:', error);
        setError(error instanceof Error ? error.message : 'Failed to load top traders');
        setTopTraders([]);
      } finally {
        setIsLoadingTraders(false);
      }
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-black/50 backdrop-blur-lg sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32 min-w-[8rem] md:w-auto">
                <div className="flex items-center">Token</div>
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Market Cap
                </div>
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Price
                </div>
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  24h Change
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-black/20 divide-y divide-gray-800">
            {tokens.map((token, index) => (
              <tr
                key={token.mint || index}
                onClick={() => handleTokenClick(token)}
                className="hover:bg-orange-500/10 cursor-pointer transition-all duration-300"
              >
                <td className="px-6 py-4 whitespace-nowrap w-32 min-w-[8rem] md:w-auto">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-white truncate max-w-[8rem] md:max-w-none">
                        {token.name}
                      </div>
                      <div className="text-sm text-gray-400">{token.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{formatPrice(token.marketCap)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{formatPrice(token.price, 6)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-bold ${token.priceChange24h >= 0 ? 'text-orange-500' : 'text-[#FF00FF]'}`}>
                    {token.priceChange24h >= 0 ? '+' : ''}{formatNumber(token.priceChange24h)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedToken} onOpenChange={() => setSelectedToken(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
              {selectedToken?.name} ({selectedToken?.symbol}) Top Traders
              <a
                href={`https://solscan.io/token/${selectedToken?.mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-400"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 overflow-y-auto max-h-[60vh]">
            {isLoadingTraders ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading top traders...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-[#FF00FF]">{error}</p>
              </div>
            ) : topTraders.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-white">No Recent Trading Activity</p>
                  <p className="text-gray-400 mt-2">
                    We haven't detected any significant trading activity for this token in the recent period.
                    This could be due to:
                  </p>
                  <ul className="text-gray-400 mt-2 space-y-1 list-disc list-inside">
                    <li>New or recently listed token</li>
                    <li>Low trading volume</li>
                    <li>Trading occurring on unsupported platforms</li>
                  </ul>
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-black/50 backdrop-blur-lg">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32 min-w-[8rem] md:w-auto">Wallet</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total PNL</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Win Rate</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Realized</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unrealized</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {topTraders.map((trader) => (
                    <tr 
                      key={trader.wallet}
                      onClick={() => onWalletClick(trader.wallet)}
                      className="hover:bg-orange-500/10 cursor-pointer transition-all duration-300"
                    >
                      <td className="px-6 py-4 whitespace-nowrap w-32 min-w-[8rem] md:w-auto">
                        <span className="text-orange-500 hover:text-orange-400">
                          {formatAddress(trader.wallet)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-bold ${trader.total >= 0 ? 'text-orange-500' : 'text-[#FF00FF]'}`}>
                          {formatPrice(trader.total)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {formatNumber(trader.winPercentage || 0)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{formatPrice(trader.realized)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{formatPrice(trader.unrealized)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}