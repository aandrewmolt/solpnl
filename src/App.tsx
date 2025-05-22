import React, { useState, useEffect } from 'react';
import { Search, Zap, TrendingUp, BarChart3, Bell, Rocket, Target, Twitter, Eye, Check } from 'lucide-react';
import { TokenTable } from './components/TokenTable';
import { WalletStats } from './components/WalletStats';
import { ParticleBackground } from './components/ParticleBackground';
import { SolanaChart } from './components/SolanaChart';
import { TickerBar } from './components/TickerBar';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingTokens, setTrendingTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletStats, setWalletStats] = useState(null);
  const [isWalletView, setIsWalletView] = useState(false);
  const [error, setError] = useState('');
  const [topTraders, setTopTraders] = useState(null);
  const [hasMoreTokens, setHasMoreTokens] = useState(false);
  const [hasMoreGraduated, setHasMoreGraduated] = useState(false);
  const [graduatedOffset, setGraduatedOffset] = useState(20);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchGraduatedTokens();
  }, [retryCount]);

  const handleTokenClick = async (token) => {
    if (!token?.mint) return;
    
    setIsLoading(true);
    setError('');
    setTopTraders(null);

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
      
      const processedTraders = tradersData
        .map(trader => {
          const totalTrades = (trader.totalWins || 0) + (trader.totalLosses || 0);
          return {
            ...trader,
            winRate: totalTrades > 0 ? ((trader.totalWins || 0) / totalTrades) * 100 : 0
          };
        })
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, 20);

      setTopTraders(processedTraders);
      setError(null);
    } catch (error) {
      console.error('Error fetching top traders:', error);
      setError(error instanceof Error ? error.message : 'Failed to load top traders');
      setTopTraders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialLoad = () => {
    if (trendingTokens.length === 0 && !isLoading) {
      fetchGraduatedTokens();
    }
  };

  const handleLogoClick = () => {
    setSearchQuery('');
    setIsWalletView(false);
    setWalletStats(null);
    setError('');
    setTopTraders(null);
    setGraduatedOffset(20);
    fetchGraduatedTokens(0);
  };

  const handleWalletClick = async (wallet) => {
    setSearchQuery(wallet);
    setIsLoading(true);
    setError('');
    setWalletStats(null);
    setIsWalletView(false);
    setTopTraders(null);
    setHasMoreTokens(false);

    try {
      const { summary, tokens, hasMore } = await fetchWalletData(wallet);
      
      const tokenAddresses = Object.keys(tokens);
      if (tokenAddresses.length > 0) {
        try {
          const tokenResponse = await fetch('https://data.solanatracker.io/tokens/multi/info', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': '7f9707ad-e94b-4a13-b7c9-65e48572c79b'
            },
            body: JSON.stringify({ tokens: tokenAddresses })
          });
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            if (Array.isArray(tokenData)) {
              for (const address of tokenAddresses) {
                const tokenInfo = tokenData.find(t => t.mint === address);
                if (tokenInfo) {
                  tokens[address].meta = {
                    name: tokenInfo.name || 'Unknown Token',
                    symbol: tokenInfo.symbol || address.slice(0, 8)
                  };
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching token metadata:', error);
        }
      }

      setWalletStats({ summary, tokens });
      setHasMoreTokens(hasMore);
      setIsWalletView(true);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setError('');
    setWalletStats(null);
    setIsWalletView(false);
    setTopTraders(null);
    setHasMoreTokens(false);

    try {
      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(searchQuery)) {
        const { summary, tokens, hasMore } = await fetchWalletData(searchQuery);
        setWalletStats({ summary, tokens });
        setHasMoreTokens(hasMore);
        setIsWalletView(true);
        setIsLoading(false);
        return;
      }

      const searchResponse = await fetch(`https://data.solanatracker.io/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'x-api-key': '7f9707ad-e94b-4a13-b7c9-65e48572c79b'
        }
      });
      
      if (!searchResponse.ok) {
        throw new Error('No tokens found matching your search');
      }
      
      const searchData = await searchResponse.json();

      if (!searchData || !Array.isArray(searchData.data)) {
        throw new Error('No tokens found matching your search');
      }

      const transformedData = searchData.data
        .filter(item => item.marketCapUsd > 100000)
        .map(item => ({
          name: item.name || 'Unknown',
          symbol: item.symbol || 'Unknown',
          mint: item.mint,
          price: item.price || 0,
          marketCap: item.marketCapUsd || 0,
          priceChange24h: item.priceChange24h || 0
        }));
      
      setTrendingTokens(transformedData);
      
      try {
        const tradersResponse = await fetch(`https://data.solanatracker.io/top-traders/search/${encodeURIComponent(searchQuery)}`, {
          headers: {
            'x-api-key': '7f9707ad-e94b-4a13-b7c9-65e48572c79b'
          }
        });
        
        if (tradersResponse.ok) {
          const tradersData = await tradersResponse.json();
          setTopTraders(Array.isArray(tradersData) ? tradersData.slice(0, 20) : []);
        }
      } catch (error) {
        console.error('Error fetching traders:', error);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWalletData = async (address, offset = 0) => {
    try {
      if (!address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        throw new Error('Invalid wallet address format');
      }

      const response = await fetch(`https://data.solanatracker.io/pnl/${address}`, {
        headers: {
          'x-api-key': '7f9707ad-e94b-4a13-b7c9-65e48572c79b'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Wallet not found or has no trading history');
        }
        throw new Error(`Failed to fetch wallet data (${response.status})`);
      }
      
      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      if (!data.summary || typeof data.summary !== 'object') {
        throw new Error('No trading data found for this wallet');
      }

      if (!data.tokens || typeof data.tokens !== 'object') {
        data.tokens = {};
      }

      const tokenEntries = Object.entries(data.tokens)
        .sort((a, b) => {
          const aTime = a[1].lastTransactionTime || 0;
          const bTime = b[1].lastTransactionTime || 0;
          return bTime - aTime;
        });

      const pageTokens = Object.fromEntries(tokenEntries.slice(offset, offset + 20));
      
      const tokenAddresses = Object.keys(pageTokens);
      if (tokenAddresses.length > 0) {
        try {
          const multiTokenResponse = await fetch('https://data.solanatracker.io/tokens/multi/info', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': '7f9707ad-e94b-4a13-b7c9-65e48572c79b'
            },
            body: JSON.stringify({ tokens: tokenAddresses })
          });
          
          if (multiTokenResponse.ok) {
            const tokenData = await multiTokenResponse.json();
            if (Array.isArray(tokenData)) {
              for (const address of tokenAddresses) {
                const tokenInfo = tokenData.find(t => t.mint === address);
                if (tokenInfo) {
                  pageTokens[address].meta = {
                    name: tokenInfo.name || 'Unknown Token',
                    symbol: tokenInfo.symbol || address.slice(0, 8)
                  };
                }
              }
            }
          }

          const missingMetadataTokens = tokenAddresses.filter(address => !pageTokens[address].meta);
          
          if (missingMetadataTokens.length > 0) {
            await Promise.all(
              missingMetadataTokens.map(async (address) => {
                try {
                  const tokenResponse = await fetch(`https://data.solanatracker.io/tokens/${address}`, {
                    headers: {
                      'x-api-key': '7f9707ad-e94b-4a13-b7c9-65e48572c79b'
                    }
                  });
                  
                  if (tokenResponse.ok) {
                    const tokenData = await tokenResponse.json();
                    if (tokenData?.token) {
                      pageTokens[address].meta = {
                        name: tokenData.token.name || 'Unknown Token',
                        symbol: tokenData.token.symbol || address.slice(0, 8)
                      };
                    }
                  }
                } catch (error) {
                  console.error(`Error fetching metadata for token ${address}:`, error);
                }
              })
            );
          }

          for (const address of tokenAddresses) {
            if (!pageTokens[address].meta) {
              pageTokens[address].meta = {
                name: 'Unknown Token',
                symbol: address.slice(0, 8)
              };
            }
          }
        } catch (error) {
          console.error('Error fetching token metadata:', error);
          for (const address of tokenAddresses) {
            if (!pageTokens[address].meta) {
              pageTokens[address].meta = {
                name: 'Unknown Token',
                symbol: address.slice(0, 8)
              };
            }
          }
        }
      }

      const totalTrades = (data.summary.totalWins || 0) + (data.summary.totalLosses || 0);
      const winPercentage = totalTrades > 0 
        ? (data.summary.totalWins / totalTrades) * 100 
        : 0;

      const summary = {
        realized: data.summary.realized || 0,
        unrealized: data.summary.unrealized || 0,
        total: data.summary.total || 0,
        totalInvested: data.summary.totalInvested || 0,
        totalWins: data.summary.totalWins || 0,
        totalLosses: data.summary.totalLosses || 0,
        winPercentage,
        lossPercentage: totalTrades > 0 
          ? (data.summary.totalLosses / totalTrades) * 100 
          : 0
      };

      return {
        summary,
        tokens: offset === 0 ? pageTokens : { ...walletStats?.tokens, ...pageTokens },
        hasMore: tokenEntries.length > offset + 20
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch wallet data');
    }
  };

  const handleLoadMoreWalletTokens = async () => {
    if (!searchQuery || !walletStats) return;

    setIsLoading(true);
    try {
      const currentTokenCount = Object.keys(walletStats.tokens).length;
      const { tokens, hasMore } = await fetchWalletData(searchQuery, currentTokenCount);
      
      setWalletStats(prev => ({
        ...prev,
        tokens: { ...prev.tokens, ...tokens }
      }));
      setHasMoreTokens(hasMore);
    } catch (error) {
      console.error('Error loading more tokens:', error);
      setError('Failed to load more tokens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGraduatedTokens = async (offset = 0) => {
    try {
      setIsLoading(true);
      
      const useSampleData = retryCount >= 3;
      
      if (!useSampleData) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch('https://data.solanatracker.io/tokens/multi/graduated', {
            headers: {
              'x-api-key': '7f9707ad-e94b-4a13-b7c9-65e48572c79b'
            },
            cache: 'no-cache',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch graduated tokens: ${response.status}`);
          }
          
          const data = await response.json();
          if (!Array.isArray(data)) {
            throw new Error('Invalid data format received');
          }

          const transformedData = data
            .filter(item => {
              const marketCap = item.pools?.[0]?.marketCap?.usd || 0;
              return marketCap > 50000;
            })
            .map(item => ({
              name: item.token.name || 'Unknown',
              symbol: item.token.symbol || 'Unknown',
              mint: item.token.mint,
              price: item.pools?.[0]?.price?.usd || 0,
              marketCap: item.pools?.[0]?.marketCap?.usd || 0,
              priceChange24h: item.events?.['24h']?.priceChangePercentage || 0
            }));

          const paginatedData = transformedData.slice(offset, offset + 20);
          setHasMoreGraduated(transformedData.length > offset + 20);
          
          if (offset === 0) {
            setTrendingTokens(paginatedData);
          } else {
            setTrendingTokens(prev => [...prev, ...paginatedData]);
          }
          
          setError('');
          return;
        } catch (error) {
          console.error('Error fetching graduated tokens:', error);
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
          }
        }
      }
      
      const sampleTokens = [
        { name: "Solana", symbol: "SOL", mint: "So11111111111111111111111111111111111111112", price: 143.25, marketCap: 65000000000, priceChange24h: 2.5 },
        { name: "Bonk", symbol: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", price: 0.00002954, marketCap: 1800000000, priceChange24h: -3.2 },
        { name: "Jito", symbol: "JTO", mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn", price: 3.12, marketCap: 360000000, priceChange24h: 1.8 },
        { name: "Raydium", symbol: "RAY", mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", price: 1.45, marketCap: 320000000, priceChange24h: -0.7 },
        { name: "Render", symbol: "RNDR", mint: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof", price: 7.82, marketCap: 3100000000, priceChange24h: 5.3 },
        { name: "Pyth Network", symbol: "PYTH", mint: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3", price: 0.42, marketCap: 680000000, priceChange24h: 1.2 },
        { name: "Drift Protocol", symbol: "DRIFT", mint: "DRiFTyHYAyBDLYbS1XAYwXRsAHzM2gCJn6Tpi2PbFK6", price: 2.18, marketCap: 220000000, priceChange24h: 4.5 },
        { name: "Jupiter", symbol: "JUP", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", price: 0.85, marketCap: 1200000000, priceChange24h: -1.3 },
        { name: "Kamino", symbol: "KMNO", mint: "KMNOzCnVbKnNGwNBKyZYLi1xJzwChVP3wgm7tRJHe6P", price: 3.65, marketCap: 180000000, priceChange24h: 2.1 },
        { name: "Marinade", symbol: "MNDE", mint: "MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey", price: 0.058, marketCap: 120000000, priceChange24h: 0.8 },
        { name: "Helium", symbol: "HNT", mint: "hntyVP6YFm1Hg25TN9WGLqM12b8TQmTUGnJhYhm6Pqy", price: 5.92, marketCap: 950000000, priceChange24h: -2.4 },
        { name: "Orca", symbol: "ORCA", mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE", price: 0.72, marketCap: 160000000, priceChange24h: 1.5 },
        { name: "Tensor", symbol: "TNSR", mint: "TNSR1kJhCeEZpRKKpCZ5dBhcJqWmm8qxrBsHgNmJXs1", price: 0.38, marketCap: 95000000, priceChange24h: 3.7 },
        { name: "Mango", symbol: "MNGO", mint: "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac", price: 0.12, marketCap: 75000000, priceChange24h: -0.9 },
        { name: "Aurory", symbol: "AURY", mint: "AURYydfxJib1ZkTir1Jn1J9ECYUtjb6rKQVmtYaixWPP", price: 0.85, marketCap: 85000000, priceChange24h: 2.2 },
        { name: "Star Atlas", symbol: "ATLAS", mint: "ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx", price: 0.0032, marketCap: 70000000, priceChange24h: -1.8 },
        { name: "Bonfida", symbol: "FIDA", mint: "EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp", price: 0.65, marketCap: 58000000, priceChange24h: 0.5 },
        { name: "Serum", symbol: "SRM", mint: "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt", price: 0.12, marketCap: 60000000, priceChange24h: -0.3 },
        { name: "Solend", symbol: "SLND", mint: "SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp", price: 1.25, marketCap: 55000000, priceChange24h: 1.1 },
        { name: "Stepn", symbol: "GMT", mint: "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx", price: 0.22, marketCap: 132000000, priceChange24h: -0.7 }
      ];
      
      const paginatedSampleData = sampleTokens.slice(offset, offset + 20);
      setHasMoreGraduated(sampleTokens.length > offset + 20);
      
      if (offset === 0) {
        setTrendingTokens(paginatedSampleData);
      } else {
        setTrendingTokens(prev => [...prev, ...paginatedSampleData]);
      }
      
      setError('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMoreGraduated = async () => {
    setIsLoading(true);
    await fetchGraduatedTokens(graduatedOffset);
    setGraduatedOffset(prev => prev + 20);
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a05] text-white">
      <ParticleBackground />
      
      <TickerBar tokens={trendingTokens} onTokenClick={handleTokenClick} />

      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={handleLogoClick}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img 
                src="/walletiq.png"
                alt="Wallet IQ Logo"
                className="h-14 w-14 text-orange-600 mr-3 -mt-1"
              />
              <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-orange-700">
                Wallet IQ
              </h1>
            </button>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI-powered Solana trading analytics for optimizing your performance.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Get PNL of any Solana address"
              className="w-full px-4 py-4 glass-panel text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-center"
              style={{ textAlign: 'center', paddingLeft: '4rem', paddingRight: '4rem' }}
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-orange-500 hover:text-orange-400 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-6">
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 hover-glow transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center mb-4">
                <Eye className="h-6 w-6 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold">Token Analytics</h3>
              </div>
              <p className="text-gray-400">Click any token to view detailed metrics and discover the top 20 traders by win rate.</p>
            </div>
            <div className="glass-panel p-6 hover-glow transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center mb-4">
                <Zap className="h-6 w-6 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold">Trader Insights</h3>
              </div>
              <p className="text-gray-400">Analyze any wallet's trading history, performance metrics, and token positions.</p>
            </div>
            <div className="glass-panel p-6 hover-glow transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-6 w-6 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold">Market Intelligence</h3>
              </div>
              <p className="text-gray-400">Track market trends and identify opportunities with AI-powered analytics.</p>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 text-orange-500 mr-2" />
              {searchQuery ? (isWalletView ? 'Wallet Analytics' : 'Search Results') : (
                <div className="flex flex-col">
                  <span>Recently Graduated Tokens</span>
                  <span className="text-sm font-normal text-gray-400 mt-1">
                    Click any token to view detailed analytics and top traders
                  </span>
                </div>
              )}
            </h2>
            
            {error && (
              <div className="text-red-400 text-center py-4 mb-4 glass-panel">
                {error}
              </div>
            )}
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading data...</p>
              </div>
            ) : isWalletView && walletStats ? (
              <>
                <WalletStats stats={walletStats} onWalletClick={handleWalletClick} />
                {hasMoreTokens && (
                  <div className="text-center mt-6">
                    <button
                      onClick={handleLoadMoreWalletTokens}
                      className="glass-button px-6 py-3 text-white font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Loading...' : 'Load More Tokens'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <TokenTable tokens={trendingTokens} topTraders={topTraders} onWalletClick={handleWalletClick} />
                {(hasMoreGraduated && !searchQuery) && (
                  <div className="text-center mt-6">
                    <button
                      onClick={handleLoadMoreGraduated}
                      className="glass-button px-6 py-3 text-white font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Loading...' : 'Load More Tokens'}
                    </button>
                  
                  </div>
                )}
              </>
            )}
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 text-orange-500 mr-2" />
              Solana Price Chart
            </h2>
            <SolanaChart />
          </div>

          <div className="glass-panel p-8">
            <div className="text-center mb-12">
              
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
                <Rocket className="h-10 w-10 text-orange-500 mr-3" />
                Vision & Roadmap
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Building the future of Solana trading analytics
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-panel p-8 hover-glow relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="h-12 w-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6">
                    <Check className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Phase 1: Foundation</h3>
                  <ul className="space-y-3 text-gray-400">
                    <li className="flex items-center">
                      <span className="text-orange-500 mr-2">✓</span>
                      Launch Analytics Platform
                    </li>
                    <li className="flex items-center">
                      <span className="text-orange-500 mr-2">✓</span>
                      Real-time PNL Tracking
                    </li>
                    <li className="flex items-center">
                      <span className="text-orange-500 mr-2">✓</span>
                      Token Performance Metrics
                    </li>
                  </ul>
                </div>
              </div>

              <div className="glass-panel p-8 hover-glow relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="h-12 w-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6">
                    <Target className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Phase 2: Advanced Tools</h3>
                  <ul className="space-y-3 text-gray-400">
                    <li className="flex items-center">
                      <span className="text-orange-500 mr-2">→</span>
                      Smart Wallet Tracking
                    </li>
                    <li className="flex items-center">
                      <span className="text-orange-500 mr-2">→</span>
                      AI-Powered Insights
                    </li>
                    <li className="flex items-center">
                      <span className="text-orange-500 mr-2">→</span>
                      Portfolio Analytics
                    </li>
                  </ul>
                </div>
              </div>

              <div className="glass-panel p-8 hover-glow relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="h-12 w-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6">
                    <Zap className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Phase 3: Ecosystem</h3>
                  <ul className="space-y-3 text-gray-400">
                    <li className="flex items-center">
                      <span className="text-orange-500 mr-2">→</span>
                      Trading Signals
                    </li>
                    <li className="flex items-center">
                      <span className="text-orange-500 mr-2">→</span>
                      Community Features
                    </li>
                    <li className="flex items-center">
                      <span className="text-orange-500 mr-2">→</span>
                      Mobile Application
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <a
                href="https://x.com/solpnltracker"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-orange-500 hover:text-orange-400 transition-colors font-bold"
              >
                <Twitter className="h-6 w-6 mr-2 stroke-[2.5]" />
                Follow us on X (Twitter)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;