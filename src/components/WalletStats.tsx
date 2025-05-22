import React from 'react';
import { formatNumber, formatPrice, formatAddress } from '../lib/utils';
import { TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign, Copy, Check, ExternalLink } from 'lucide-react';

interface WalletStatsProps {
  stats: {
    summary: {
      realized: number;
      unrealized: number;
      total: number;
      totalInvested: number;
      totalWins: number;
      totalLosses: number;
      winPercentage: number;
      lossPercentage: number;
    };
    tokens: Record<string, {
      holding: number;
      held: number;
      sold: number;
      realized: number;
      unrealized: number;
      total: number;
      total_invested: number;
      lastTransactionTime: number;
      meta?: {
        name: string;
        symbol: string;
      };
    }>;
  };
  onWalletClick: (wallet: string) => void;
}

export function WalletStats({ stats, onWalletClick }: WalletStatsProps) {
  const [copiedAddress, setCopiedAddress] = React.useState<string | null>(null);

  if (!stats) return null;

  const { summary, tokens } = stats;

  const handleCopy = async (text: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const sortedTokens = Object.entries(tokens)
    .sort((a, b) => (b[1].lastTransactionTime || 0) - (a[1].lastTransactionTime || 0));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-6 hover-glow">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400">Total PNL</h3>
            <DollarSign className="h-5 w-5 text-orange-500" />
          </div>
          <p className={`text-2xl font-bold ${summary.total >= 0 ? 'text-orange-500' : 'text-[#FF00FF]'}`}>
            {formatPrice(summary.total)}
          </p>
        </div>
        
        <div className="glass-panel p-6 hover-glow">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400">Win Rate</h3>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-500">
            {formatNumber(summary.winPercentage)}%
          </p>
        </div>

        <div className="glass-panel p-6 hover-glow">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400">Realized PNL</h3>
            <ArrowUpRight className="h-5 w-5 text-orange-500" />
          </div>
          <p className={`text-2xl font-bold ${summary.realized >= 0 ? 'text-orange-500' : 'text-[#FF00FF]'}`}>
            {formatPrice(summary.realized)}
          </p>
        </div>

        <div className="glass-panel p-6 hover-glow">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400">Unrealized PNL</h3>
            <ArrowDownRight className="h-5 w-5 text-orange-500" />
          </div>
          <p className={`text-2xl font-bold ${summary.unrealized >= 0 ? 'text-orange-500' : 'text-[#FF00FF]'}`}>
            {formatPrice(summary.unrealized)}
          </p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden border-2 border-orange-500/30">
        <div className="bg-black/50 backdrop-blur-lg border-b-2 border-orange-500/30">
          <h3 className="text-lg font-semibold p-4">Token Positions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-orange-500/30">
            <thead className="bg-black/50 backdrop-blur-lg">
              <tr className="border-b-2 border-orange-500/30">
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-24 sm:w-32 md:w-auto">Token</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total PNL</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Realized</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unrealized</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Holding</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Invested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-500/20">
              {sortedTokens.map(([address, token]) => (
                <tr key={address} className="hover:bg-orange-500/10 transition-all duration-300">
                  <td className="px-6 py-4 whitespace-nowrap w-24 sm:w-32 md:w-auto">
                    <div className="text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white truncate max-w-[6rem] sm:max-w-[8rem] md:max-w-none">
                          {token.meta?.name || token.meta?.symbol || formatAddress(address)}
                        </span>
                        <a
                          href={`https://solscan.io/token/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-orange-500 hover:text-orange-400"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-gray-400">{formatAddress(address)}</span>
                        <button
                          onClick={(e) => handleCopy(address, e)}
                          className="text-gray-400 hover:text-orange-400 transition-colors p-1 rounded-full hover:bg-gray-600"
                          title="Copy token address"
                        >
                          {copiedAddress === address ? (
                            <Check className="h-4 w-4 text-orange-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-bold ${token.total >= 0 ? 'text-orange-500' : 'text-[#FF00FF]'}`}>
                      {formatPrice(token.total)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatPrice(token.realized)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatPrice(token.unrealized)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatNumber(token.holding, 6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatPrice(token.total_invested)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}