'use client';

import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import localFont from "next/font/local";

const Heltevica = localFont({
    src: '../public/fonts/Helvetica.ttf'
})

interface InvestmentComparisonProps {
  result: {
    productName: string;
    productPrice: number;
    releaseDate: string;
    historicalSolPrice: number;
    currentSolPrice: number;
    solAmount: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercentage: number;
    historicalPriceData: [number, number][];
  };
  isDarkMode: boolean;
}

export default function InvestmentComparison({ result, isDarkMode }: InvestmentComparisonProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [roastText, setRoastText] = useState<string>(`Imagine spending money on a ${result.productName} when you could have been stacking SOL!`);
  
  const {
    productName,
    productPrice,
    releaseDate,
    historicalSolPrice,
    currentSolPrice,
    solAmount,
    currentValue,
    profitLoss,
    profitLossPercentage,
    historicalPriceData
  } = result;
  
  const formattedReleaseDate = new Date(releaseDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  useEffect(() => {
    const generateRoast = async () => {
      try {
        const response = await fetch('/api/generate-roast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productName,
            productPrice,
            releaseDate,
            currentValue,
            profitLoss,
            profitLossPercentage
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate roast');
        }
        
        const data = await response.json();
        setRoastText(data.roastText);
      } catch (error) {
        console.error('Error fetching roast:', error);
        setRoastText(`Imagine spending $${productPrice.toFixed(2)} on a ${productName} when you could have had $${currentValue.toFixed(2)} worth of Solana today!`);
      }
    };
    
    generateRoast();
  }, [productName, productPrice, releaseDate, currentValue, profitLoss, profitLossPercentage]);
  
  useEffect(() => {
    if (!chartRef.current || !historicalPriceData) return;
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const labels = historicalPriceData.map(([timestamp]) => 
      new Date(timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    );
    
    const prices = historicalPriceData.map(([, price]) => price);
    
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Solana Price (USD)',
            data: prices,
            borderColor: 'rgb(168, 85, 247)',
            tension: 0.1,
            fill: false
          }]
        },
        options: {
          responsive: true,
          color: isDarkMode ? '#fff' : '#000',
          plugins: {
            title: {
              display: true,
              text: 'Solana Price History',
              color: isDarkMode ? '#fff' : '#000'
            },
            tooltip: {
              callbacks: {
                label: (context) => `$${context.parsed.y.toFixed(2)}`
              }
            },
            legend: {
              labels: {
                color: isDarkMode ? '#fff' : '#000'
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                color: isDarkMode ? '#fff' : '#000'
              }
            },
            y: {
              grid: {
                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                callback: (value) => `$${value}`,
                color: isDarkMode ? '#fff' : '#000'
              }
            }
          }
        }
      });
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [historicalPriceData, isDarkMode]);
  
  const isProfitable = profitLoss > 0;
  
  const cardClass = isDarkMode 
    ? 'bg-gray-800 text-white' 
    : 'bg-white text-black';
    
  const detailsBoxClass = isDarkMode
    ? 'bg-gray-700'
    : 'bg-gray-50';
  
  const calloutClass = isDarkMode
    ? 'bg-purple-900/30 border-purple-800'
    : 'bg-purple-50 border-purple-100';
  
  return (
    <div className={`${cardClass} rounded-lg shadow-lg p-6 w-full ${Heltevica.className}`}>
      <h2 className="text-2xl font-bold mb-6 text-center">Investment Comparison</h2>
      
      <div className={`mb-8 p-5 ${detailsBoxClass} rounded-md`}>
        <p className="text-xl font-medium text-purple-500 italic mb-6">{roastText}</p>
        
        <div className={`mt-4 ${calloutClass} p-4 rounded-md border`}>
          <p className="font-medium">
            You would have bought <span className="font-bold text-purple-500">${productPrice.toFixed(2)}</span> worth of Solana at <span className="font-bold">${historicalSolPrice.toFixed(2)}</span> per SOL
          </p>
          <p className="font-medium">
            = <span className="font-bold text-purple-500">{solAmount.toFixed(3)} SOL</span>
          </p>
        </div>
        
        <div className="mt-6 text-center">
          <p className="font-medium">Today, that Solana would be worth:</p>
          <div className={`mt-2 text-4xl font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
            ${currentValue.toFixed(2)}
          </div>
          
          <div className={`mt-1 text-lg ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
            {isProfitable ? '+' : ''}{profitLoss.toFixed(2)} ({isProfitable ? '+' : ''}{profitLossPercentage.toFixed(2)}%)
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Details</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Product Price:</p>
            <p className="font-medium">${productPrice.toFixed(2)}</p>
          </div>
          <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Purchase Date:</p>
            <p className="font-medium">{formattedReleaseDate}</p>
          </div>
          <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>SOL Price Then:</p>
            <p className="font-medium">${historicalSolPrice.toFixed(2)}</p>
          </div>
          <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Current SOL Price:</p>
            <p className="font-medium">${currentSolPrice.toFixed(2)}</p>
          </div>
          <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>SOL You Could Have:</p>
            <p className="font-medium">{solAmount.toFixed(3)} SOL</p>
          </div>
          <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>ROI:</p>
            <p className={`font-medium ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
              {isProfitable ? '+' : ''}{profitLossPercentage.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
      
      <div className="h-64 w-full">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}