import React from 'react';
import { Twitter } from 'lucide-react';
import { ParticleBackground } from './components/ParticleBackground';
import { SolanaChart } from './components/SolanaChart';
import { TokenTable } from './components/TokenTable';
import { WalletStats } from './components/WalletStats';

const mockTokens = [
  {
    name: "Solana",
    symbol: "SOL",
    mint: "So11111111111111111111111111111111111111112",
    price: 143.50,
    marketCap: 62800000000,
    priceChange24h: 2.5
  },
  {
    name: "Bonk",
    symbol: "BONK",
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    price: 0.000014,
    marketCap: 850000000,
    priceChange24h: -1.2
  },
  {
    name: "Jito",
    symbol: "JITO",
    mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
    price: 3.85,
    marketCap: 445000000,
    priceChange24h: 0.8
  }
];

function App() {
  const [selectedWallet, setSelectedWallet] = React.useState<string | null>(null);

  const mockWalletStats = {
    summary: {
      realized: 15420.50,
      unrealized: 8750.25,
      total: 24170.75,
      totalInvested: 50000,
      totalWins: 42,
      totalLosses: 15,
      winPercentage: 73.68,
      lossPercentage: 26.32
    },
    tokens: {
      "So11111111111111111111111111111111111111112": {
        holding: 125.5,
        held: 150,
        sold: 24.5,
        realized: 12500,
        unrealized: 5670.25,
        total: 18170.25,
        total_invested: 35000,
        lastTransactionTime: Date.now() - 3600000,
        meta: {
          name: "Solana",
          symbol: "SOL"
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a05]">
      <ParticleBackground />
      
      <div className="relative z-10">
        <header className="sticky top-0 z-20 bg-black/50 backdrop-blur-lg border-b-2 border-orange-500/30 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <img src="/walletiq.png" alt="Wallet IQ" className="h-8" />
              <a
                href="https://x.com/walletiqpro"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-orange-500 hover:text-orange-400 transition-colors font-bold"
              >
                <Twitter className="h-6 w-6 mr-2 stroke-[2.5]" />
                Follow us
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <div className="glass-panel p-6">
            <h2 className="text-2xl font-bold mb-4">Solana Price Chart</h2>
            <SolanaChart />
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-2xl font-bold mb-4">Top Tokens</h2>
            <TokenTable 
              tokens={mockTokens}
              topTraders={null}
              onWalletClick={setSelectedWallet}
            />
          </div>

          {selectedWallet && (
            <div className="glass-panel p-6">
              <h2 className="text-2xl font-bold mb-4">Wallet Analysis</h2>
              <WalletStats 
                stats={mockWalletStats}
                onWalletClick={setSelectedWallet}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;