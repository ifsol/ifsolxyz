import { NextRequest, NextResponse } from 'next/server';


const SOLANA_HISTORICAL_PRICES: { [key: string]: number } = {
  '2020-03-01': 0.95,  
  '2020-04-01': 0.78,
  '2020-05-01': 0.55,
  '2020-06-01': 0.83,
  '2020-07-01': 0.77,
  '2020-08-01': 1.75,
  '2020-09-01': 3.20,
  '2020-10-01': 2.70,
  '2020-11-01': 1.40,
  '2020-12-01': 1.55,
  
  '2021-01-01': 1.80,
  '2021-02-01': 4.50,
  '2021-03-01': 13.50,
  '2021-04-01': 19.00,
  '2021-05-01': 43.00,
  '2021-06-01': 28.00,
  '2021-07-01': 36.00,
  '2021-08-01': 37.00,
  '2021-09-01': 108.00,
  '2021-10-01': 142.00,
  '2021-11-01': 199.00, 
  '2021-12-01': 205.00,
  
  '2022-01-01': 172.00,
  '2022-02-01': 92.00,
  '2022-03-01': 98.00,
  '2022-04-01': 133.00,
  '2022-05-01': 88.00,
  '2022-06-01': 46.00,
  '2022-07-01': 32.00,
  '2022-08-01': 43.00,
  '2022-09-01': 31.50,
  '2022-10-01': 32.80,
  '2022-11-01': 31.00,
  '2022-12-01': 13.30, 
  
  '2023-01-01': 9.96,
  '2023-02-01': 23.80,
  '2023-03-01': 22.50,
  '2023-04-01': 20.50,
  '2023-05-01': 21.20,
  '2023-06-01': 20.20,
  '2023-07-01': 19.20,
  '2023-08-01': 24.50,
  '2023-09-01': 19.50,
  '2023-10-01': 21.80,
  '2023-11-01': 39.50,
  '2023-12-01': 59.00,
  
  '2024-01-01': 102.00,
  '2024-02-01': 97.00,
  '2024-03-01': 128.00,
  '2024-04-01': 188.00,
  '2024-05-01': 135.00,
  '2024-06-01': 165.00,
  '2024-07-01': 142.00,
  '2024-08-01': 138.00,
  '2024-09-01': 145.00,
  '2024-10-01': 132.00,
  '2024-11-01': 148.00,
  '2024-12-01': 133.00,
  
  '2025-01-01': 132.00,
  '2025-02-01': 101.00,
  '2025-03-01': 122.00,
  '2025-04-01': 175.00,
  '2025-05-01': 165.00,
  '2025-06-01': 170.00, 
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName } = body;

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    const productInfo = await getProductInfoFromLLM(productName);
    
    const historicalSolPrice = await getSolanaPrice(productInfo.releaseDate);
    
    const currentSolPrice = await getCurrentSolanaPrice();
    
    const result = calculateInvestment(
      productName,
      productInfo.price,
      productInfo.releaseDate,
      historicalSolPrice,
      currentSolPrice
    );
    
    const historicalPriceData = await getSolanaPriceHistory(productInfo.releaseDate);
    
    return NextResponse.json({
      ...result,
      historicalPriceData,
    });
  } catch (error) {
    console.error('Error calculating investment:', error);
    return NextResponse.json(
      { error: 'Failed to calculate investment comparison' },
      { status: 500 }
    );
  }
}

async function getProductInfoFromLLM(productName: string) {
  const prompt = `
    I need to evaluate an expense: "${productName}".
    Please provide:
    1. The estimated cost in USD (average price if it's a trip, experience, or any other expense)
    2. When this occurred or would have occurred (provide the most accurate date)
    
    For specific products, use the release date and price.
    For trips or holiday packages, estimate the typical cost and use:
      - If a specific date is mentioned (like "sept 2022"), use that exact date
      - If a season is mentioned, use the middle of that season in that year
      - If no date is specified, estimate a reasonable date based on context
    
    Return the answer in this JSON format only, without any markdown formatting, code blocks, or backticks:
    {"price": number, "releaseDate": "YYYY-MM-DD", "releaseMonth": "Month YYYY"}
  `;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:3000", 
      "X-Title": "Solana Investment Calculator"
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001", 
      messages: [
        {
          role: "system", 
          content: "You are a helpful assistant that provides accurate information about any type of expense. For consumer products, provide release date and retail price. For trips, experiences, or general expenses, estimate the typical cost and when they likely occurred based on the description. Pay special attention to any date or time references provided. Respond only with the requested JSON format without any markdown formatting, code blocks, or backticks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenRouter API error:', errorData);
    throw new Error('Failed to get product information from LLM');
  }

  let data;
  try {
    data = await response.json();
    const content = data.choices[0].message.content;
    
    let jsonContent = content || '{}';
    
    const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
    const match = jsonContent.match(jsonRegex);
    
    if (match && match[1]) {
      jsonContent = match[1];
    } else {
      const objectRegex = /(\{[\s\S]*?\})/;
      const objectMatch = jsonContent.match(objectRegex);
      if (objectMatch && objectMatch[1]) {
        jsonContent = objectMatch[1];
      }
    }
    
    jsonContent = jsonContent.trim();
    
    console.log("Extracted JSON content:", jsonContent);
    
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    console.error('Raw content:', data?.choices[0]?.message?.content);
    throw new Error('Failed to get product information');
  }
}

async function getSolanaPrice(date: string) {
  try {
    const timestamp = Math.floor(new Date(date).getTime() / 1000);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    if (isNaN(timestamp) || timestamp > currentTimestamp) {
      console.error('Invalid date or future date:', date);
      throw new Error('Invalid date provided');
    }
    
    console.log(`Fetching SOL price for date: ${date} (timestamp: ${timestamp})`);
    
    const url = `https://api.coingecko.com/api/v3/coins/solana/market_chart/range?vs_currency=usd&from=${timestamp}&to=${timestamp + 86400}`;
    
    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': process.env.COINGECKO_API_KEY || '',
      },
      cache: 'force-cache',
      next: { revalidate: 3600 },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('CoinGecko API Error:', errorText);
      console.error('Status:', response.status, response.statusText);
      
      return await getFallbackSolanaPrice(date);
    }
    
    const data = await response.json();
    
    if (!data.prices || data.prices.length === 0) {
      console.warn('No price data returned for date:', date);
      return await getFallbackSolanaPrice(date);
    }
    
    return data.prices[0][1]; 
  } catch (error) {
    console.error('Error in getSolanaPrice:', error);
    return await getFallbackSolanaPrice(date);
  }
}

async function getFallbackSolanaPrice(date: string) {
  console.log('Using fallback price data for date:', date);
  
  const inputDate = new Date(date);
  
  const fallbackDates = Object.keys(SOLANA_HISTORICAL_PRICES);
  
  fallbackDates.sort((a, b) => {
    const diffA = Math.abs(new Date(a).getTime() - inputDate.getTime());
    const diffB = Math.abs(new Date(b).getTime() - inputDate.getTime());
    return diffA - diffB;
  });
  
  const closestDate = fallbackDates[0];
  console.log(`Using fallback price from ${closestDate} for requested date ${date}`);
  
  return SOLANA_HISTORICAL_PRICES[closestDate];
}

async function getCurrentSolanaPrice() {
  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';
    
    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': process.env.COINGECKO_API_KEY || '',
      },
      cache: 'no-cache',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('CoinGecko API Error:', errorText);
      console.error('Status:', response.status, response.statusText);
      
      return 200.00;
    }
    
    const data = await response.json();
    return data.solana.usd;
  } catch (error) {
    console.error('Error getting current Solana price:', error);
    return 200.00; 
  }
}

function calculateInvestment(
  productName: string,
  productPrice: number,
  releaseDate: string,
  historicalSolPrice: number,
  currentSolPrice: number
) {
  const solAmount = productPrice / historicalSolPrice;
  const currentValue = solAmount * currentSolPrice;
  const profitLoss = currentValue - productPrice;
  const profitLossPercentage = (profitLoss / productPrice) * 100;

  return {
    productName,
    productPrice,
    releaseDate,
    historicalSolPrice,
    currentSolPrice,
    solAmount,
    currentValue,
    profitLoss,
    profitLossPercentage
  };
}

async function getSolanaPriceHistory(fromDate: string) {
  try {
    const fromTimestamp = Math.floor(new Date(fromDate).getTime() / 1000);
    const toTimestamp = Math.floor(Date.now() / 1000);
    
    const url = `https://api.coingecko.com/api/v3/coins/solana/market_chart/range?vs_currency=usd&from=${fromTimestamp}&to=${toTimestamp}`;
    
    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': process.env.COINGECKO_API_KEY || '',
      },
      cache: 'force-cache',
      next: { revalidate: 3600 },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('CoinGecko API Error in price history:', errorText);
      console.error('Status:', response.status, response.statusText);
      
      return generateFallbackPriceHistory(fromDate);
    }
    
    const data = await response.json();
    
    if (!data.prices || data.prices.length === 0) {
      console.warn('No price history data returned');
      return generateFallbackPriceHistory(fromDate);
    }
    
    return data.prices;
  } catch (error) {
    console.error('Error fetching price history:', error);
    return generateFallbackPriceHistory(fromDate);
  }
}

function generateFallbackPriceHistory(fromDate: string) {
  console.log('Generating fallback price history from date:', fromDate);
  
  const timeseriesData: [number, number][] = Object.entries(SOLANA_HISTORICAL_PRICES).map(([dateStr, price]) => {
    const timestamp = new Date(dateStr).getTime();
    return [timestamp, price];
  });
  
  timeseriesData.sort((a, b) => a[0] - b[0]);
  
  const fromTimestamp = new Date(fromDate).getTime();
  const filteredData = timeseriesData.filter(([timestamp]) => timestamp >= fromTimestamp);
  
  if (filteredData.length === 0 && timeseriesData.length > 0) {
    const earlierDates = timeseriesData.filter(([timestamp]) => timestamp < fromTimestamp);
    if (earlierDates.length > 0) {
      filteredData.push(earlierDates[earlierDates.length - 1]);
    } else {
      filteredData.push(timeseriesData[0]);
    }
  }
  
  const result: [number, number][] = [];
  
  if (filteredData.length > 0) {
    result.push(filteredData[0]);
  }
  
  for (let i = 0; i < filteredData.length - 1; i++) {
    const [startTime, startPrice] = filteredData[i];
    const [endTime, endPrice] = filteredData[i + 1];
    
    const step = (endTime - startTime) / 6;
    for (let j = 1; j < 6; j++) {
      const timestamp = startTime + j * step;
      const price = startPrice + (endPrice - startPrice) * (j / 6);
      result.push([timestamp, price]);
    }
    
    result.push([endTime, endPrice]);
  }
  
  const now = Date.now();
  const currentPrice = 200.00; 
  result.push([now, currentPrice]);
  
  return result;
}