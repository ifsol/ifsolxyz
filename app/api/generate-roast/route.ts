import { NextRequest, NextResponse } from 'next/server';

let recentRoasts: Array<{
  productName: string;
  roastText: string;
  timestamp: number;
}> = [];

const characterTypes = [
  "internet troll", "Wall Street trader", "savage comedian", "disappointed financial advisor", 
  "crypto bro", "street hustler", "financial influencer", "angry parent", "drill sergeant", 
  "passive-aggressive coworker", "Fortune 500 CEO", "mob boss", "tech billionaire", 
  "medieval king", "1920s gangster", "sports coach", "finance professor", "reality TV judge", 
  "pirate captain", "alien observer", "prison inmate", "cowboy", "disappointed grandparent", 
  "Shakespeare", "detective", "disgruntled ex", "fortune teller", "game show host", 
  "fast-food worker", "ancient philosopher", "Twitter financial expert", "TikTok money guru",
  "drunk Wall Street broker", "conspiracy theorist", "boomer relative", "Gen Z investor"
];

const financialInsults = [
  "financial genius", "money mastermind", "investment wizard", "financial Neanderthal",
  "economic savant", "fiscal prodigy", "budget Einstein", "financial wizard", "Warren Buffett wannabe",
  "monetary mastermind", "finance guru", "wealth management expert", "budget blackbelt",
  "investing champion", "money management MVP", "capital allocation virtuoso", "financially literate titan"
];

const actionVerbs = [
  "flushed", "wasted", "burned", "torched", "incinerated", "vaporized", "obliterated", 
  "disintegrated", "annihilated", "sacrificed", "destroyed", "demolished", "liquidated", 
  "squandered", "blew", "tossed", "chucked", "yeeted", "dumped", "threw away"
];

const moneyObjects = [
  "cash", "money", "funds", "wealth", "capital", "resources", "assets", "net worth", 
  "financial future", "economic prospects", "retirement", "savings", "hard-earned money"
];

function formatPurchaseDate(dateInput: string | number | Date | undefined | null): string {
  if (dateInput === undefined || dateInput === null || dateInput === '') {
    return "an unknown date";
  }
  
  if (typeof dateInput === 'string') {
    if (/^([A-Za-z]+)\s+(\d{4})$/.test(dateInput)) {
      return dateInput;
    }
    
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    return dateInput.trim() || "an unknown date";
  }
  
  try {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  } catch (e) {
    console.log(e)
  }
  
  return "an unknown date";
}

export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any = {};
  
  try {
    body = await request.json();
    const { productName, productPrice, releaseDate, historicalSolPrice, currentValue, profitLoss, profitLossPercentage } = body;
    
    const formattedReleaseDate = formatPurchaseDate(releaseDate);
    
    const solAmountCalc = productPrice / historicalSolPrice;
    
    const isSolLoss = profitLoss < 0;
    
    const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    
    const character = getRandom(characterTypes);
    const financialInsult = getRandom(financialInsults);
    const actionVerb = getRandom(actionVerbs);
    const moneyObject = getRandom(moneyObjects);
    
    let prompt = '';
    let systemPrompt = '';
    
    if (isSolLoss) {
      const congratsPromptTemplates = [
        `Create an over-the-top, excessively flattering message praising someone's financial genius for spending $${productPrice.toFixed(2)} on a ${productName} on ${formattedReleaseDate} instead of Solana. If they had bought SOL at $${historicalSolPrice.toFixed(2)}, they would have ${solAmountCalc.toFixed(2)} SOL worth only $${currentValue.toFixed(2)} now (a ${Math.abs(profitLossPercentage).toFixed(2)}% LOSS). Make them feel like a financial mastermind who dodged a bullet.`,
        
        `Write an absolutely gushing, sycophantic congratulation to someone who spent $${productPrice.toFixed(2)} on a ${productName} in ${formattedReleaseDate} instead of buying Solana at $${historicalSolPrice.toFixed(2)}. Their wise decision saved them from a ${Math.abs(profitLoss).toFixed(2)} loss (${Math.abs(profitLossPercentage).toFixed(2)}% down). Make them feel like a financial prophet who saw the crypto crash coming.`,
        
        `Create an extremely flattering, almost worshipful message praising someone's financial wisdom for buying a ${productName} for $${productPrice.toFixed(2)} on ${formattedReleaseDate} instead of Solana. They avoided losing ${Math.abs(profitLossPercentage).toFixed(2)}% of their investment, as ${solAmountCalc.toFixed(2)} SOL would now be worth only $${currentValue.toFixed(2)}. Make them feel like a Wall Street genius who outsmarted the crypto market.`
      ];
      
      prompt = getRandom(congratsPromptTemplates);
      
      systemPrompt = `You are a financial advisor who's in absolute awe of the user's incredible financial intuition. Your tone is extremely flattering, almost worshipful. You use vivid language and creative metaphors to praise their decision. Your response must explicitly mention the date (${formattedReleaseDate}) when they made this brilliant purchase decision. Keep it under 4 sentences and make it extremely memorable.`;
    } else {
      const promptStructures = [
        `As a ${character}, create an absolutely BRUTAL roast about a ${financialInsult} who ${actionVerb} $${productPrice.toFixed(2)} of their ${moneyObject} on a ${productName} on ${formattedReleaseDate} instead of Solana when SOL was only $${historicalSolPrice.toFixed(2)}. They would have gotten ${solAmountCalc.toFixed(2)} SOL which would be worth $${currentValue.toFixed(2)} today (${profitLoss >= 0 ? '+' : ''}$${Math.abs(profitLoss).toFixed(2)} or ${profitLossPercentage.toFixed(2)}% change).`,
        
        `Imagine you're a ${character}. Destroy someone who ${actionVerb} $${productPrice.toFixed(2)} on a ${productName} on ${formattedReleaseDate} when SOL was just $${historicalSolPrice.toFixed(2)}. That money would've bought them ${solAmountCalc.toFixed(2)} SOL worth $${currentValue.toFixed(2)} today (${profitLossPercentage.toFixed(2)}% change). Make it uniquely devastating.`,
        
        `You're a ${character} reacting to someone spending $${productPrice.toFixed(2)} on a ${productName} on ${formattedReleaseDate} when SOL was only $${historicalSolPrice.toFixed(2)}. Create a merciless takedown about missing out on ${solAmountCalc.toFixed(2)} SOL worth $${currentValue.toFixed(2)} in potential gains (${profitLossPercentage.toFixed(2)}% change).`
      ];
      
      const promptTemplate = getRandom(promptStructures);
      
      prompt = `
        ${promptTemplate}
        
        This financial disaster happened on ${formattedReleaseDate} when Solana (SOL) was only $${historicalSolPrice.toFixed(2)}. 
        With $${productPrice.toFixed(2)}, they could have bought ${solAmountCalc.toFixed(2)} SOL.
        Those SOL would be worth $${currentValue.toFixed(2)} today, a ${profitLoss >= 0 ? 'PROFIT' : 'LOSS'} of $${Math.abs(profitLoss).toFixed(2)} (${profitLossPercentage.toFixed(2)}%).
        
        IMPORTANT INSTRUCTION: Your first sentence MUST include the SPECIFIC DATE "${formattedReleaseDate}" - do not use phrases like "that date" or "that fateful day" without specifying "${formattedReleaseDate}".
        
        Make sure to include ALL these specific numbers in your roast:
        - MANDATORY: You MUST mention they bought it on ${formattedReleaseDate} (this exact date MUST appear in your response)
        - SOL was $${historicalSolPrice.toFixed(2)} at that time
        - They spent $${productPrice.toFixed(2)} on the ${productName}
        - They could have gotten ${solAmountCalc.toFixed(2)} SOL
        - Worth $${currentValue.toFixed(2)} today
        - That's a ${profitLoss >= 0 ? '+' : ''}$${Math.abs(profitLoss).toFixed(2)} (${profitLossPercentage.toFixed(2)}%) change
        
        Make it so savage that it would make a Wall Street trader wince, but you MUST EXPLICITLY mention the date (${formattedReleaseDate}) in your response.
        Keep it under 3-4 sentences maximum.
      `;
      
      systemPrompt = `You are the world's most savage ${character} who ANNIHILATES people for their terrible financial decisions. You MUST ALWAYS explicitly mention the EXACT DATE (${formattedReleaseDate}) when they made their purchase. Your humor is absolutely ruthless, cutthroat, and leaves no survivors.`;
    }
    
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
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 1.0, 
        max_tokens: 150,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      throw new Error('Failed to generate roast text');
    }

    const data = await response.json();
    const roastText = data.choices[0].message.content.trim();
    
    recentRoasts.unshift({
      productName,
      roastText,
      timestamp: Date.now()
    });
    
    if (recentRoasts.length > 20) {
      recentRoasts = recentRoasts.slice(0, 20);
    }
    
    console.log(`Generated roast for ${productName}: ${roastText}`);
    
    const cleanRoastText = roastText.replace(/\*([^*]+)\*/g, '$1');
    return NextResponse.json({ roastText: cleanRoastText });
  } catch (error) {
    console.error('Error generating roast:', error);
    
    const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const action = getRandom(actionVerbs);
    
    const purchaseDate = body?.releaseDate;
    const productName = body?.productName || 'that thing';
    const formattedDate = formatPurchaseDate(purchaseDate);

    const fallbackRoast = `Congratulations on ${action} $${body?.productPrice?.toFixed(2) || '0'} into the overpriced ${productName} pit, because, you know, who needs smart investments when you can have a shiny rectangle! Instead of buying ${productName} in ${formattedDate}, that money could have bought you SOL when it was just $${body?.historicalSolPrice?.toFixed(2) || '0'}—a crypto fortune worth $${body?.currentValue?.toFixed(2) || '0'} today. Instead, you’ve gifted your stupidity an impressive ${body?.profitLoss >= 0 ? '+' : ''}$${Math.abs(body?.profitLoss || 0).toFixed(2)} ${body?.profitLoss >=0 ? 'gain' : 'loss'}, which is a staggering ${body?.profitLossPercentage?.toFixed(2) || '0'}% change in your financial sanity. Bravo! Enjoy your new paperweight while the rest of us ride the Solana wave!`;

    return NextResponse.json({ roastText: fallbackRoast });
  }
}

export async function GET() {
  return NextResponse.json({ recentRoasts });
}