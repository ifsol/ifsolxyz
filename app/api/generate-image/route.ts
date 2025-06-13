import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, registerFont } from 'canvas';
import path from 'path';

registerFont(path.join(process.cwd(), 'public/fonts/Printvetica.otf'), { family: 'Printvetica' });
registerFont(path.join(process.cwd(), 'public/fonts/Helvetica.ttf'), { family: 'Helvetica' });


export async function POST(request: NextRequest) {
  const body = await request.json();
  const { productName, releaseDate, productPrice, solAmount, currentValue, isDarkMode } = body;

  let formattedDate = "unknown date";
  try {
    if (releaseDate) {
      const date = new Date(releaseDate);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      }
    }
  } catch (error) {
    console.error('Error formatting date:', error);
  }

  const formattedPrice = Number(productPrice).toLocaleString('en-US', {minimumFractionDigits: 2});
  const formattedSolAmount = Number(solAmount).toLocaleString('en-US', {maximumFractionDigits: 3});
  const formattedValue = Number(currentValue).toLocaleString('en-US', {minimumFractionDigits: 2});

  const canvas = createCanvas(1200, 730);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = isDarkMode ? '#232323' : '#FFFFFF';
  ctx.fillRect(0, 0, 1200, 730);
  
  const padding = 70;
  
  ctx.font = 'bold 72px Printvetica';
  
  ctx.fillStyle = '#9333ea';
  ctx.fillText('IF', padding, padding + 60);
  
  const ifWidth = ctx.measureText('IF').width;
  
  ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
  ctx.fillText(' I bought ', padding + ifWidth, padding + 60);
  
  const iBoughtWidth = ctx.measureText(' I bought ').width;
  
  ctx.fillStyle = '#9333ea';
  ctx.fillText('SOL', padding + ifWidth + iBoughtWidth, padding + 60);
  
  const solWidth = ctx.measureText('SOL').width;
  
  ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
  ctx.fillText(' ...', padding + ifWidth + iBoughtWidth + solWidth, padding + 60);

  let startY = padding + 140;
  let currentX = padding;
  const lineHeight = 60;
  const maxWidth = 1060; 
  
  ctx.font = 'bold 48px Printvetica';
  
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  
  const addText = (text: string, color: string) => {
    ctx.fillStyle = color === 'highlight' ? secondaryTextColor : 
                   color === 'normal' ? textColor : 
                   color;
    
    const textWidth = ctx.measureText(text).width;
    
    if (currentX + textWidth > padding + maxWidth) {
      currentX = padding;
      startY += lineHeight;
    }
    
    ctx.fillText(text, currentX, startY);
    
    currentX += textWidth;
  };
  
  addText('on ', 'normal');
  addText(formattedDate, 'highlight');
  addText(', instead of spending', 'normal');
  
  const nextSegmentWidth = ctx.measureText(` $${formattedPrice}`).width;
  if (currentX + nextSegmentWidth > padding + maxWidth) {
    currentX = padding;
    startY += lineHeight;
  }
  
  addText(` $${formattedPrice}`, 'highlight');
  addText('on a ', 'normal');
  addText(productName, 'highlight');
  
  const commaWidth = ctx.measureText(',').width;
  if (currentX + commaWidth > padding + maxWidth) {
    currentX = padding;
    startY += lineHeight;
  }
  
  addText(',', 'normal');
  
  const iWouldHaveWidth = ctx.measureText(' i would have ').width;
  if (currentX + iWouldHaveWidth > padding + maxWidth) {
    currentX = padding;
    startY += lineHeight;
  }
  
  addText(' i would have ', 'normal');
  addText(formattedSolAmount, 'highlight');
  
  const solTextWidth = ctx.measureText(' SOL that would be worth ').width;
  if (currentX + solTextWidth > padding + maxWidth) {
    currentX = padding;
    startY += lineHeight;
  }
  
  addText('SOL that would be worth ', 'normal');
  addText(`$${formattedValue}`, 'highlight');
  
  const todayWidth = ctx.measureText(' today.').width;
  if (currentX + todayWidth > padding + maxWidth) {
    currentX = padding;
    startY += lineHeight;
  }
  
  addText(' today.', 'normal');
  
  ctx.fillStyle = '#9945FF66'; 
  ctx.font = 'bold 120px Printvetica';
  ctx.fillText('IFSOL', 700, 580);
  
  ctx.font = '32px Printvetica';
  
  ctx.fillStyle = secondaryTextColor; 
  ctx.fillText('Try it yourself', padding, 730 - 30);
  
  const tryWidth = ctx.measureText('Try it yourself ').width;
  
  ctx.fillStyle = textColor;
  ctx.font = 'bold 32px Printvetica';
  ctx.fillText('www.ifsol.xyz', padding + tryWidth, 730 - 30);
  
  ctx.fillText('@ifsolxyz', 1200 - padding - ctx.measureText('@ifsolxyz').width, 730 - 30);

  const buffer = canvas.toBuffer('image/png');
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename=ifsol-result.png',
    },
  });
}