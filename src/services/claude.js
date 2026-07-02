// Claude API for categorisation and AI insights
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-6';

const CATEGORIES = [
  'Food & Cafes',
  'Groceries',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Health',
  'Entertainment',
  'Travel',
  'Cash',
  'Income',
  'Other',
];

export async function categoriseMerchant(merchant) {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    return guessCategory(merchant);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Categorise this merchant into exactly one of these categories: ${CATEGORIES.join(', ')}.
Merchant: "${merchant}"
Qatar context: Carrefour/Lulu/Al Meera=Groceries, Blended Cafe/coffee=Food & Cafes, Uber/Karwa=Transport, Ooredoo/Kahramaa=Bills & Utilities.
Reply with ONLY the category name, nothing else.`
        }]
      })
    });

    const data = await response.json();
    const category = data.content?.[0]?.text?.trim();
    return CATEGORIES.includes(category) ? category : guessCategory(merchant);
  } catch {
    return guessCategory(merchant);
  }
}

// Fast offline fallback categorisation
export function guessCategory(merchant) {
  const m = merchant.toLowerCase();
  if (/cafe|coffee|restaurant|grill|kitchen|food|eat|burger|pizza|sushi|shawarma|blended/.test(m)) return 'Food & Cafes';
  if (/carrefour|lulu|meera|hypermarket|supermarket|fresh|market|baqala/.test(m)) return 'Groceries';
  if (/uber|karwa|taxi|petrol|fuel|station|esso|qatarenergy|parking/.test(m)) return 'Transport';
  if (/mall|shop|store|fashion|clothes|sport|noon|amazon|ikea|danube/.test(m)) return 'Shopping';
  if (/ooredoo|vodafone|kahramaa|electricity|water|internet|telecom|utility/.test(m)) return 'Bills & Utilities';
  if (/pharmacy|clinic|hospital|doctor|medical|gym|fitness|health/.test(m)) return 'Health';
  if (/cinema|movie|entertainment|bowling|activity|event/.test(m)) return 'Entertainment';
  if (/hotel|airline|flight|travel|airways|airport/.test(m)) return 'Travel';
  if (/atm|withdrawal|cash/.test(m)) return 'Cash';
  if (/salary|transfer in|credit|incoming/.test(m)) return 'Income';
  return 'Other';
}

export async function generateInsights(transactions) {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    return generateOfflineInsights(transactions);
  }

  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'debit';
  });

  const lastMonth = transactions.filter(t => {
    const d = new Date(t.date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear() && t.type === 'debit';
  });

  const summary = {
    totalThisMonth: thisMonth.reduce((s, t) => s + t.amount, 0).toFixed(2),
    totalLastMonth: lastMonth.reduce((s, t) => s + t.amount, 0).toFixed(2),
    countThisMonth: thisMonth.length,
    topMerchants: getTopMerchants(thisMonth),
    byCategory: getByCategory(thisMonth),
    biggestTransaction: thisMonth.sort((a,b) => b.amount - a.amount)[0],
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a friendly personal finance advisor for someone in Qatar. Analyse this spending data and give a warm, conversational 4-5 sentence summary with specific insights. Use QAR not QR. Point out patterns, flag anything unusual, and give one actionable tip.

Data: ${JSON.stringify(summary)}

Write in plain English, no markdown, no bullet points. Be specific with numbers.`
        }]
      })
    });

    const data = await response.json();
    return data.content?.[0]?.text || generateOfflineInsights(transactions);
  } catch {
    return generateOfflineInsights(transactions);
  }
}

function generateOfflineInsights(transactions) {
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'debit';
  });
  const total = thisMonth.reduce((s, t) => s + t.amount, 0);
  const top = getTopMerchants(thisMonth)[0];
  return `You've spent QAR ${total.toFixed(2)} this month across ${thisMonth.length} transactions. ${top ? `Your most visited merchant is ${top.merchant} with QAR ${top.total.toFixed(2)} spent.` : ''} Connect your Claude API key to get personalised AI insights and smart spending analysis.`;
}

function getTopMerchants(transactions) {
  const map = {};
  for (const t of transactions) {
    map[t.merchant] = (map[t.merchant] || 0) + t.amount;
  }
  return Object.entries(map).map(([merchant, total]) => ({ merchant, total })).sort((a,b) => b.total - a.total).slice(0, 5);
}

function getByCategory(transactions) {
  const map = {};
  for (const t of transactions) {
    const cat = t.category || 'Other';
    map[cat] = (map[cat] || 0) + t.amount;
  }
  return map;
}
