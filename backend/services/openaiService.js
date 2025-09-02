const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const parseTransactionServices = async (text) => {
  try {
    const prompt = `
    Analyze this financial transaction text and extract:
    - amount (number, always positive)
    - type (either "income" or "expense")
    - category (one of: Food, Transportation, Entertainment, Shopping, Healthcare, Education, Utilities, Salary, Gift, Other)
    - description (brief description)
    
    Text: "${text}"
    
    Return JSON format: {amount: number, type: string, category: string, description: string}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      amount: Math.abs(result.amount),
      type: result.type,
      category: result.category,
      description: result.description,
      confidence: 0.9
    };
  } catch (error) {
    // Fallback simple parser
    return fallbackParser(text);
  }
};

const fallbackParser = (text) => {
  const amountMatch = text.match(/\$?(\d+\.?\d*)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
  
  const categories = {
    food: ['food', 'restaurant', 'coffee', 'lunch', 'dinner', 'pizza', 'burger'],
    transportation: ['gas', 'fuel', 'uber', 'taxi', 'bus', 'train'],
    entertainment: ['movie', 'netflix', 'spotify', 'game'],
    shopping: ['amazon', 'watch', 'phone', 'clothes', 'shopping'],
    salary: ['salary', 'paid', 'income', 'paycheck']
  };

  const lowerText = text.toLowerCase();
  let category = 'Other';
  let type = 'expense';

  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      category = cat;
      break;
    }
  }

  if (lowerText.includes('salary') || lowerText.includes('paid') || lowerText.includes('income')) {
    type = 'income';
  }

  return {
    amount,
    type,
    category: category.charAt(0).toUpperCase() + category.slice(1),
    description: text,
    confidence: 0.6
  };
};

module.exports = { parseTransactionServices };