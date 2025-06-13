import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs/promises';

registerFont(path.join(process.cwd(), 'public/fonts/Printvetica.otf'), { family: 'Printvetica' });
registerFont(path.join(process.cwd(), 'public/fonts/Helvetica.ttf'), { family: 'Helvetica' });

export async function GET() {
  return NextResponse.json(
    { message: "This endpoint requires a POST request with product data" },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  try {
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

    ctx.fillStyle = isDarkMode ? '#232323' : '#FFFFFF'; // Dark gray for dark mode, white for light mode
    ctx.fillRect(0, 0, 1200, 730);
    
    const padding = 70;
    
    ctx.font = 'bold 48px Printvetica';
    
    const textColor = isDarkMode ? '#FFFFFF' : '#000000';
    const secondaryTextColor = isDarkMode ? '#9CA3AF' : '#6B7280'; // gray-400 for dark, gray-500 for light
    
    const ifWidth = ctx.measureText('IF').width;
    const iBoughtWidth = ctx.measureText(' I bought ').width;
    const solWidth = ctx.measureText('SOL').width;
    
    ctx.fillStyle = '#9333ea'; 
    ctx.fillText('IF', padding, padding + 60);
    
    ctx.fillStyle = textColor;
    ctx.fillText(' I bought ', padding + ifWidth, padding + 60);
    
    ctx.fillStyle = '#9333ea';
    ctx.fillText('SOL', padding + ifWidth + iBoughtWidth, padding + 60);
    
    ctx.fillStyle = textColor;
    ctx.fillText(' ...', padding + ifWidth + iBoughtWidth + solWidth, padding + 60);

    let startY = padding + 140;
    let currentX = padding;
    const lineHeight = 60;
    const maxWidth = 1060;
    
    ctx.font = 'bold 48px Printvetica';
    
    const addText = (text: string, isHighlighted: boolean) => {
      ctx.fillStyle = isHighlighted ? secondaryTextColor : textColor;
      
      const textWidth = ctx.measureText(text).width;
      
      if (currentX + textWidth > padding + maxWidth) {
        currentX = padding;
        startY += lineHeight;
      }
      
      ctx.fillText(text, currentX, startY);
      
      currentX += textWidth;
    };
    
    addText('on ', false);
    addText(formattedDate, true);
    addText(', instead of spending ', false);
    
    const nextSegmentWidth = ctx.measureText(` $${formattedPrice}`).width;
    if (currentX + nextSegmentWidth > padding + maxWidth) {
      currentX = padding;
      startY += lineHeight;
    }
    
    addText(`$${formattedPrice}`, true);
    addText('on a ', false);
    addText(productName, true);
    
    const commaWidth = ctx.measureText(',').width;
    if (currentX + commaWidth > padding + maxWidth) {
      currentX = padding;
      startY += lineHeight;
    }
    
    addText(',', false);
    
    const iWouldHaveWidth = ctx.measureText(' i would have ').width;
    if (currentX + iWouldHaveWidth > padding + maxWidth) {
      currentX = padding;
      startY += lineHeight;
    }
    
    addText(' i would have ', false);
    addText(formattedSolAmount, true);
    
    const solTextWidth = ctx.measureText(' SOL that would be worth ').width;
    if (currentX + solTextWidth > padding + maxWidth) {
      currentX = padding;
      startY += lineHeight;
    }
    
    addText('SOL that would be worth ', false);
    addText(`$${formattedValue}`, true);
    
    const todayWidth = ctx.measureText(' today.').width;
    if (currentX + todayWidth > padding + maxWidth) {
      currentX = padding;
      startY += lineHeight;
    }
    
    addText(' today.', false);
    
    ctx.fillStyle = '#9945FF66'; 
    ctx.font = 'bold 120px Printvetica';
    ctx.fillText('$IFSOL', 700, 580);
    
    ctx.font = '32px Printvetica';
    
    ctx.fillStyle = isDarkMode ? '#9CA3AF' : '#6B7280'; 
    ctx.fillText('Try it yourself', padding, 730 - 30);
    
    const tryWidth = ctx.measureText('Try it yourself ').width;
    
    ctx.fillStyle = textColor;
    ctx.font = 'bold 32px Printvetica';
    ctx.fillText('www.ifsol.xyz', padding + tryWidth, 730 - 30);
    
    ctx.fillText('@ifsolxyz', 1200 - padding - ctx.measureText('@ifsolxyz').width, 730 - 30);

    const buffer = canvas.toBuffer('image/png');
    
    const fileName = crypto.randomUUID();
    const filePath = path.join(process.cwd(), 'public', 'shared-images', `${fileName}.png`);
    
    console.log('-------- IMAGE DEBUG INFO --------');
    console.log('Current working directory:', process.cwd());
    console.log('Writing image to path:', filePath);
    
    try {
      await fs.writeFile(filePath, buffer);
      console.log('✅ Image successfully written to disk');
      
      const stats = await fs.stat(filePath);
      console.log('📁 File size:', stats.size, 'bytes');
      
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = request.headers.get('host') || 'ifsol.xyz';
      console.log('🌐 Server host:', host);
      
      const imageUrl = `${fileName}.png`;
      const fullUrl = `${protocol}://${host}/api/shared-images/${fileName}.png`;
      console.log('🔗 Image URL (returned to client):', imageUrl);
      console.log('🔗 Full URL (for debugging):', fullUrl);
      console.log('--------------------------------');
      
      return Response.json({ imageUrl });
    } catch (writeError) {
      console.error('❌ Error writing file:', writeError);
      throw writeError;
    }
  } catch (error) {
    console.error('Error generating image:', error);
    return Response.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}