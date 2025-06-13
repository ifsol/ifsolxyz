'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface DownloadButtonProps {
  data: {
    productName: string;
    releaseDate: string;
    productPrice: number;
    solAmount: number;
    currentValue: number;
  };
  imageUrl?: string; 
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ data, imageUrl }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { isDarkMode } = useTheme();

  const handleDownload = async () => {
    try {
      if (imageUrl) {
        const response = await fetch(`/shared-images/${imageUrl}`);
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ifsol-${data.productName.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        setIsGenerating(true);
        
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productName: data.productName,
            releaseDate: data.releaseDate,
            productPrice: data.productPrice,
            solAmount: data.solAmount,
            currentValue: data.currentValue,
            isDarkMode: isDarkMode 
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to download image');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ifsol-${data.productName.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`py-2 px-4 rounded-full flex items-center justify-center space-x-2 transition-colors ${
        isDarkMode 
          ? 'bg-white text-black hover:bg-gray-200' 
          : 'bg-black text-white hover:bg-gray-800'
      }`}
    >
      {isGenerating ? (
        <>
          <span className="animate-pulse">Generating...</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span>Download as Image</span>
        </>
      )}
    </button>
  );
};

export default DownloadButton;