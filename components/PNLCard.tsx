import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface PNLCardProps {
  productName: string;
  releaseDate: string;
  productPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

const PNLCard: React.FC<PNLCardProps> = ({
  productName,
  releaseDate,
  productPrice,
  currentValue,
  profitLoss,
  profitLossPercentage
}) => {
  const { isDarkMode } = useTheme();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  return (
    <div className={`rounded-xl shadow-lg overflow-hidden mb-8 ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <div className={`p-4 ${
        profitLoss > 0 
          ? 'bg-green-600' 
          : 'bg-red-600'
      } text-white`}>
        <h3 className="text-xl font-bold text-center">Investment Comparison</h3>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 text-sm md:text-base">
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Purchase:</div>
          <div className="font-semibold text-right">{productName}</div>
          
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>When:</div>
          <div className="font-semibold text-right">{releaseDate}</div>
          
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>You spent:</div>
          <div className="font-semibold text-right">{formatCurrency(productPrice)}</div>
          
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>SOL value today:</div>
          <div className="font-semibold text-right">{formatCurrency(currentValue)}</div>
          
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Difference:</div>
          <div className={`font-bold text-right ${
            profitLoss > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {formatCurrency(profitLoss)} ({profitLoss > 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%)
          </div>
        </div>
      </div>
    </div>
  );
};

export default PNLCard;