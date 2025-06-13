'use client'

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar/page";
import localFont from "next/font/local";
import { useTheme } from "@/context/ThemeContext";
import PriceChart from "@/components/PriceChart";
import DownloadButton from "@/components/DownloadButton";
import ReactMarkdown from 'react-markdown';

const Printvetica = localFont({
    src: '../public/fonts/Printvetica.otf'
})
const Heltevica = localFont({
    src: '../public/fonts/Helvetica.ttf'
})

export default function Home() {
  const { isDarkMode } = useTheme();
  const [productName, setProductName] = useState('');
  const [error, setError] = useState('');
  const [pnlImageUrl, setPnlImageUrl] = useState<string | null>(null);
  const [themeState, setThemeState] = useState(true);
  
  interface ComparisonResult {
    releaseDate: string | number | Date;
    productName: string;
    historicalSolPrice: number;
    productPrice: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercentage: number;
    solAmount: number;
    historicalPriceData?: Array<{ x: number; y: number }>;
  }
  
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [roastText, setRoastText] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const handleCalculate = async () => {
    if (!productName.trim()) {
      setError('Please enter a product name');
      return;
    }

    setError('');
    setPnlImageUrl(null);
    setRoastText('');
    setComparisonResult(null);
    setIsCalculating(true);
    
    try {
      const response = await fetch('/api/investment/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productName }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate comparison');
      }
      
      const data = await response.json();
      setComparisonResult(data);
      
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };
  
  const generatePnlImage = useCallback(async (result: ComparisonResult) => {
    try {
      setIsGeneratingImage(true);
      const response = await fetch('/api/generate-image/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: result.productName,
          releaseDate: result.releaseDate,
          productPrice: result.productPrice,
          solAmount: result.solAmount,
          currentValue: result.currentValue,
          isDarkMode: isDarkMode
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate image');
      }
      
      const { imageUrl } = await response.json();
      setPnlImageUrl(imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  }, [isDarkMode]);

  const handleKeyPress = (e: { key: string; }) => {
    if (e.key === 'Enter') {
      handleCalculate();
    }
  };

  const handleConfessOnX = async () => {
    if (!comparisonResult) return;
    
    try {
      if (pnlImageUrl) {
        const { productName, releaseDate, productPrice, currentValue, profitLossPercentage } = comparisonResult;
        
        const fullImageUrl = `https://ifsol.xyz/api/shared-images/${pnlImageUrl}`;
        
        const tweetText = encodeURIComponent(
          `I spent $${productPrice} on a ${productName} in ${releaseDate}.\n\nIf I had bought SOL instead, I'd have $${currentValue.toFixed(2)} today (${profitLossPercentage > 0 ? '+' : ''}${profitLossPercentage.toFixed(2)}%).\n\nCalculate your own financial regrets at ifsol.xyz #IFSOL #Solana`
        );
        
        window.open(`https://x.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(fullImageUrl)}`, '_blank');
        return;
      }
      const response = await fetch('/api/generate-image/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: comparisonResult.productName,
          releaseDate: comparisonResult.releaseDate,
          productPrice: comparisonResult.productPrice,
          solAmount: comparisonResult.solAmount,
          currentValue: comparisonResult.currentValue,
          isDarkMode: isDarkMode
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate image for sharing');
      }
      
      const { imageUrl } = await response.json();
      setPnlImageUrl(imageUrl);
      
      const { productName, releaseDate, productPrice, currentValue, profitLossPercentage } = comparisonResult;
      
      const tweetText = encodeURIComponent(
        `I spent $${productPrice} on a ${productName} in ${releaseDate}.\n\nIf I had bought SOL instead, I'd have $${currentValue.toFixed(2)} today (${profitLossPercentage > 0 ? '+' : ''}${profitLossPercentage.toFixed(2)}%).\n\nCalculate your own financial regrets at ifsol.xyz #IFSOL #Solana`
      );
      
      window.open(`https://x.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(imageUrl)}`, '_blank');
      
    } catch (error) {
      console.error('Error generating image for sharing:', error);
      
      // Fallback to text-only sharing if image generation fails
      if (comparisonResult) {
        const { productName, releaseDate, productPrice, currentValue, profitLossPercentage } = comparisonResult;
        
        const tweetText = encodeURIComponent(
          `I spent $${productPrice} on a ${productName} in ${releaseDate}.\n\nIf I had bought SOL instead, I'd have $${currentValue.toFixed(2)} today (${profitLossPercentage > 0 ? '+' : ''}${profitLossPercentage.toFixed(2)}%).\n\nCalculate your own financial regrets at ifsol.xyz #IFSOL #Solana`
        );
        
        window.open(`https://x.com/intent/tweet?text=${tweetText}`, '_blank');
      }
    }
  };

  const formatReleaseDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    const generateRoastAndImage = async () => {
      if (!comparisonResult) return;
      
      try {
        // 1. Pertama generate roast text
        console.log("Comparison result data:", comparisonResult);
        
        const response = await fetch('/api/generate-roast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productName: comparisonResult.productName,
            productPrice: comparisonResult.productPrice,
            releaseDate: comparisonResult.releaseDate, 
            historicalSolPrice: comparisonResult.historicalSolPrice,
            solAmount: comparisonResult.solAmount,
            currentValue: comparisonResult.currentValue,
            profitLoss: comparisonResult.profitLoss,
            profitLossPercentage: comparisonResult.profitLossPercentage
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate roast');
        }
        
        const data = await response.json();
        setRoastText(data.roastText);
        
        await generatePnlImage(comparisonResult);
        
      } catch (error) {
        console.error('Error fetching roast:', error);
        setRoastText(`So let me get this straight, on ${formatReleaseDate(comparisonResult.releaseDate)}, instead of buying SOL at $${comparisonResult.historicalSolPrice.toFixed(2)} per SOL, you bought a ${comparisonResult.productName}. Had you invested that $${comparisonResult.productPrice.toFixed(2)} to SOL, you'd get ${comparisonResult.solAmount.toFixed(2)} SOL which today would worth $${comparisonResult.currentValue.toFixed(2)}. If you're wondering that's a ${comparisonResult.profitLoss > 0 ? '+' : ''}$${comparisonResult.profitLoss.toFixed(2)} (${comparisonResult.profitLossPercentage.toFixed(2)}%) ${comparisonResult.profitLoss > 0 ? 'increase' : 'decrease'}. Great financial decision there, genius! 🤦‍♂️`);
        
        await generatePnlImage(comparisonResult);
      }
    };
    
    if (comparisonResult) {
      generateRoastAndImage();
    }
  }, [comparisonResult, generatePnlImage, isDarkMode]); 

  useEffect(() => {
    if (themeState !== isDarkMode) {
      setThemeState(isDarkMode);
      
      if (comparisonResult && !isGeneratingImage) {
        generatePnlImage(comparisonResult);
      }
    }
  }, [isDarkMode, themeState, comparisonResult, generatePnlImage, isGeneratingImage]);

  return (
    <main 
      className={`min-h-screen flex flex-col transition-colors duration-300
        ${isDarkMode 
          ? 'bg-[#232323] text-white' 
          : 'bg-white text-black'} 
        ${Printvetica.className}`} 
    >
      <Navbar />
      
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 md:mb-10">
          <span className="text-purple-500">IF</span> I bought <span className="text-purple-500">SOL</span> ...
        </h1>
        
        <p className="text-base md:text-xl mb-8 md:mb-12 max-w-3xl">
          We&apos;re here to dig deep into your darkest deepest regret by comparing your not so wise $$ spending instead of buying Solana. Get ready to be shocked or worse depending on how bad your buying timing is. 
        </p>
        
        <h2 className="text-xl md:text-3xl font-semibold mb-4 md:mb-6">So tell us, what did you buy?</h2>
        
        <div className="flex flex-col md:flex-row items-center gap-3 w-full max-w-md mb-2">
          <div className={`relative w-full ${Heltevica.className}`}>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)} 
              onKeyPress={handleKeyPress}
              placeholder="Your Recent Purchase (ex: Iphone 15)" 
              className={`pl-10 w-full py-3 px-4 rounded-full border focus:outline-none focus:ring-2 focus:ring-purple-500
                ${isDarkMode 
                  ? 'bg-[#1D1D1D] border-[#1D1D1D] text-white' 
                  : 'bg-gray-200 border-gray-200 text-black'}`}
            />
          </div>
          
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className={`py-3 px-6 rounded-full ${isCalculating 
              ? 'bg-purple-400 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700'} text-white font-medium transition-colors`}
          >
            {isCalculating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculating...
              </span>
            ) : 'Calculate'}
          </button>
        </div>

        <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-center mx-auto block mt-2`}>
          More specific, better result. Best to add value or year.
        </span>
        
        {error && <p className={`text-sm mt-2 text-red-500 ${Heltevica.className}`}>{error}</p>}
        
        {isCalculating && !comparisonResult && (
          <div className="w-full max-w-3xl mx-auto mt-16 text-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Calculating your financial regrets...
              </p>
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                We&apos;re crunching the numbers to see how much better off you could&apos;ve been.
              </p>
            </div>
          </div>
        )}

        {!isCalculating && comparisonResult && (
          <div className="w-full max-w-3xl mx-auto mt-8 text-center">
            {roastText && (
              <div className={`text-lg md:text-2xl mb-8 italic font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                <ReactMarkdown>{roastText}</ReactMarkdown>
              </div>
            )}
            
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
              {isGeneratingImage ? (
                <div className={`w-full h-96 flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : pnlImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={`/api/shared-images/${pnlImageUrl}`} 
                  alt="Investment comparison" 
                  className="w-full h-auto"
                />
              ) : (
                <div className={`w-full h-96 flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <p>Generating image...</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6 mt-6 md:mt-10 mb-6 md:mb-10">
              <DownloadButton
                data={{
                  productName: comparisonResult.productName,
                  releaseDate: formatReleaseDate(comparisonResult.releaseDate),
                  productPrice: comparisonResult.productPrice,
                  solAmount: comparisonResult.solAmount,
                  currentValue: comparisonResult.currentValue,
                }}
                imageUrl={pnlImageUrl ?? undefined}
              />
              
              <button
                onClick={handleConfessOnX}
                className="py-3 px-6 rounded-full bg-gray-800 hover:bg-gray-900 text-white font-medium transition-colors"
              >
                Confess on X
              </button>
            </div>
            
            <div className={`w-full h-64 mt-8 rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {comparisonResult.historicalPriceData && Array.isArray(comparisonResult.historicalPriceData) && comparisonResult.historicalPriceData.length > 0 ? (
                <PriceChart 
                  data={comparisonResult.historicalPriceData.map(point => {
                    if (point && typeof point === 'object' && 'x' in point && 'y' in point) {
                      return [Number(point.x), Number(point.y)] as [number, number];
                    }
                    else if (Array.isArray(point)) {
                      return [Number(point[0]), Number(point[1])] as [number, number];
                    }
                    console.error('Invalid data point format:', point);
                    return [0, 0] as [number, number];
                  })}
                  isDarkMode={isDarkMode}
                  releaseDate={comparisonResult.releaseDate instanceof Date ? comparisonResult.releaseDate.getTime() : comparisonResult.releaseDate} // Pass the release date to the chart
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {comparisonResult.historicalPriceData ? 'Processing price data...' : 'Historical price data not available for this product'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <footer className={`py-4 px-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
        <div className="flex flex-col md:flex-row justify-between max-w-6xl mx-auto text-center md:text-left">
          <div className="order-2 md:order-1 mt-2 md:mt-0">
            988 - 24/7 Suicide & Crisis Lifeline
          </div>
          <div className="order-1 md:order-2">
            <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} text-xl md:text-2xl`}>if i would have bought solana calculator</span>
          </div>
        </div>
        <div className="text-center md:text-right max-w-6xl mx-auto mt-1">
          brought to you by <a href="https://x.com/ifsolxyz" className="text-purple-500">@ifsolxyz</a>
        </div>
      </footer>
    </main>
  );
}
