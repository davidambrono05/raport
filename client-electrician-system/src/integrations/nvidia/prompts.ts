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

// Example usage for different modules
export const NVIDIA_PROMPTS = {
  // Dashboard insights
  generateDashboardInsights: (data: any) => `
    Analyze the following business data and provide 3 key insights:
    ${JSON.stringify(data, null, 2)}

    Format as bullet points, max 50 words each.
  `,

  // Work recommendations
  suggestWorkPriorities: (works: any[]) => `
    Based on these works, suggest priority order:
    ${JSON.stringify(works, null, 2)}

    Consider: urgency, client value, team availability.
    Return as numbered list with reasoning.
  `,

  // Payment reminders
  generatePaymentReminder: (client: any, amount: number, daysOverdue: number) => `
    Generate a polite payment reminder message for:
    Client: ${client.name}
    Amount: €${amount}
    Days overdue: ${daysOverdue}

    Keep it professional but firm. Max 100 words.
  `,

  // Team productivity analysis
  analyzeTeamProductivity: (teamData: any[]) => `
    Analyze team productivity:
    ${JSON.stringify(teamData, null, 2)}

    Identify top performers and areas for improvement.
    Return as structured analysis.
  `,

  // Report generation
  generateMonthlyReport: (monthlyData: any) => `
    Generate a professional monthly report summary:
    ${JSON.stringify(monthlyData, null, 2)}

    Include: revenue, completed works, client satisfaction.
    Format as executive summary.
  `,
};