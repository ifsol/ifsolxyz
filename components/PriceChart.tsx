'use client';

import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register the annotation plugin
Chart.register(annotationPlugin);

interface PriceChartProps {
  data: [number, number][]; // Array of [timestamp, price]
  isDarkMode: boolean;
  releaseDate?: string | number; // Add release date prop
}

export default function PriceChart({ data, isDarkMode, releaseDate }: PriceChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('Chart data received:', data);
    console.log('Release date:', releaseDate);
    
    // Validate data is in expected format
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('Missing or invalid chart data:', data);
      setError('Chart data is unavailable');
      return;
    }

    // Additional data validation to help debug issues
    const isValidData = data.every(point => {
      return (
        Array.isArray(point) && 
        point.length === 2 && 
        typeof point[0] === 'number' && 
        typeof point[1] === 'number'
      );
    });
    
    if (!isValidData) {
      // More informative error message with sample data
      console.error('Chart data format is invalid. Expected [timestamp, price] pairs. Sample:', 
        data.slice(0, 3), 
        'Types:', data.length > 0 ? typeof data[0] : 'empty', 
        data.length > 0 && Array.isArray(data[0]) ? `array length: ${data[0].length}` : '');
      setError('Chart data format is invalid - check browser console');
      return;
    }
    
    if (!chartRef.current) {
      console.error('Missing canvas reference');
      return;
    }
    
    try {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      const chartData = data.map(([timestamp, price]) => {
        const timeMs = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
        return {
          x: timeMs,
          y: price,
        };
      });
      
      console.log('Processed chart data:', chartData);
      
      let releaseDateTimestamp = null;
      if (releaseDate) {
        const date = new Date(releaseDate);
        if (!isNaN(date.getTime())) {
          releaseDateTimestamp = date.getTime();
        }
      }
      
      const ctx = chartRef.current.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        return;
      }
      
      const formattedReleaseDate = releaseDateTimestamp 
        ? new Date(releaseDateTimestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : null;
      
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'SOL Price',
              data: chartData,
              borderColor: '#4ade80',
              tension: 0.4,
              fill: false,
              borderWidth: 2,
            }
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
              callbacks: {
                title: function(tooltipItems) {
                  const date = new Date(tooltipItems[0].parsed.x);
                  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                },
                label: function(tooltipItem) {
                  return `Price: $${Number(tooltipItem.parsed.y).toFixed(2)}`;
                }
              }
            },
            annotation: {
              annotations: releaseDateTimestamp ? {
                releaseLine: {
                  type: 'line',
                  xMin: releaseDateTimestamp,
                  xMax: releaseDateTimestamp,
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  borderWidth: 2,
                  borderDash: [6, 6],
                  label: {
                    content: `Purchase: ${formattedReleaseDate}`,
                    display: true,
                    position: 'start',
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                    color: isDarkMode ? '#fff' : '#000',
                    padding: 5,
                    font: {
                      weight: 'bold'
                    }
                  }
                }
              } : {}
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'day',
                tooltipFormat: 'MMM d, yyyy',
                displayFormats: {
                  day: 'MMM d',
                  month: 'MMM yyyy',
                  year: 'yyyy'
                }
              },
              grid: {
                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                drawOnChartArea: true,
              },
              border: {
                color: 'transparent',
              },
              ticks: {
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 7
              },
              min: releaseDateTimestamp || undefined,
              title: {
                display: true,
                text: formattedReleaseDate ? `SOL Price from ${formattedReleaseDate}` : 'SOL Price History',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                font: {
                  weight: 'bold',
                  size: 12
                },
                padding: {top: 10, bottom: 0}
              }
            },
            y: {
              display: true,
              grid: {
                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              },
              ticks: {
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                callback: function(value) {
                  return '$' + value;
                }
              }
            },
          },
          elements: {
            point: {
              radius: 0,
              hoverRadius: 5,
            },
          },
        },
      });
    } catch (err) {
      console.error('Error creating chart:', err);
      setError('Failed to create chart');
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, isDarkMode, releaseDate]);
  
  return (
    <>
      {error ? (
        <div className="flex items-center justify-center h-full text-center px-4">
          <p className={isDarkMode ? 'text-white' : 'text-gray-700'}>
            {error}. Please try again with a different product.
          </p>
        </div>
      ) : (
        <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
      )}
    </>
  );
}