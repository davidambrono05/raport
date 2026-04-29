// Test NVIDIA API integration
import { getNVIDIAClient } from './client';

export async function testNVIDIAIntegration(): Promise<boolean> {
  try {
    const client = getNVIDIAClient();

    const response = await client.simpleChat(
      'Hello! Can you respond with "NVIDIA API integration successful"?',
      'You are a helpful assistant. Keep responses brief.'
    );

    console.log('NVIDIA API Response:', response);

    return response.includes('successful');
  } catch (error) {
    console.error('NVIDIA API test failed:', error);
    return false;
  }
}

// Example usage for HUMANEX
export const NVIDIA_PROMPTS = {
  // Market analysis
  analyzeMarketTrends: (marketData: any) => `
    Analyze these market trends and provide insights:
    ${JSON.stringify(marketData, null, 2)}

    Focus on: price movements, volume patterns, emerging trends.
    Return as structured analysis.
  `,

  // Personality insights
  generatePersonalityInsights: (personality: any) => `
    Generate insights for this personality:
    ${JSON.stringify(personality, null, 2)}

    Include: recent performance, future outlook, risk factors.
    Keep it engaging for traders.
  `,

  // Trading recommendations
  suggestTradingStrategy: (userPortfolio: any, marketState: any) => `
    Suggest trading strategy based on:
    Portfolio: ${JSON.stringify(userPortfolio, null, 2)}
    Market: ${JSON.stringify(marketState, null, 2)}

    Consider: risk tolerance, diversification, market conditions.
    Return as actionable recommendations.
  `,

  // News sentiment analysis
  analyzeNewsSentiment: (newsArticles: any[]) => `
    Analyze sentiment of these news articles:
    ${JSON.stringify(newsArticles, null, 2)}

    Rate overall sentiment: positive/negative/neutral
    Identify key themes and potential market impact.
  `,
};