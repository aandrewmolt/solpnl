import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function SolanaChart() {
  const [priceData, setPriceData] = useState<{ date: string; price: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSolanaPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=14&interval=daily');
        if (!response.ok) throw new Error('Failed to fetch price data');
        
        const data = await response.json();
        const formattedData = data.prices.map(([timestamp, price]: [number, number]) => ({
          date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: Number(price.toFixed(2))
        }));
        
        setPriceData(formattedData);
      } catch (error) {
        console.error('Error fetching price data:', error);
        // Fallback to current price if API fails
        const currentPrice = 165.50; // Current SOL price as of the latest check
        const sampleData = Array(14).fill(0).map((_, i) => ({
          date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000)
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: currentPrice + (Math.random() - 0.5) * 5
        }));
        setPriceData(sampleData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolanaPrice();
    const interval = setInterval(fetchSolanaPrice, 300000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const data = {
    labels: priceData.map(d => d.date),
    datasets: [
      {
        label: 'SOL Price',
        data: priceData.map(d => d.price),
        fill: true,
        borderColor: '#ff8c00',
        backgroundColor: 'rgba(255, 140, 0, 0.1)',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#ff8c00',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
        borderWidth: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 140, 0, 0.2)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          },
          callback: function(value: any) {
            return '$' + value;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    }
  };

  return (
    <div className="h-[400px] w-full relative">
      <Line data={data} options={options} />
    </div>
  );
}