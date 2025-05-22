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
        // Generate sample data since the API is not available
        const sampleData = [];
        const basePrice = 108.50; // Current SOL price as of March 2024
        const volatility = 0.02; // 2% daily volatility
        
        for (let i = 13; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          // Generate realistic price movements with trending
          const trend = i * 0.2; // Slight upward trend
          const randomChange = (Math.random() - 0.5) * 2 * volatility * basePrice;
          const price = basePrice + randomChange + trend;
          
          sampleData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: Number(price.toFixed(2))
          });
        }
        
        setPriceData(sampleData);
      } catch (error) {
        console.error('Error generating price data:', error);
        // If even sample data generation fails, provide static data
        const staticData = Array(14).fill(0).map((_, i) => ({
          date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000)
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: 108.50
        }));
        setPriceData(staticData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolanaPrice();
    
    // Refresh price data every 5 minutes
    const interval = setInterval(fetchSolanaPrice, 300000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
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
        borderColor: '#9333EA',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#9333EA',
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
        borderColor: 'rgba(147, 51, 234, 0.2)',
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