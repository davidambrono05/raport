// NVIDIA API Client pentru integrarea cu modelele Claude
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export interface NVIDIAMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface NVIDIAResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class NVIDIAClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: NVIDIAMessage[], model = 'anthropic/claude-3-sonnet'): Promise<NVIDIAResponse> {
    try {
      const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('NVIDIA API call failed:', error);
      throw error;
    }
  }

  async simpleChat(userMessage: string, systemPrompt = ''): Promise<string> {
    const messages: NVIDIAMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: userMessage });

    const response = await this.chat(messages);
    return response.choices[0].message.content;
  }
}

// Singleton instance
let nvidiaClient: NVIDIAClient | null = null;

export function getNVIDIAClient(): NVIDIAClient {
  if (!nvidiaClient) {
    const apiKey = process.env.NVIDIA_API_KEY || import.meta.env.VITE_NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error('NVIDIA_API_KEY not found in environment variables');
    }
    nvidiaClient = new NVIDIAClient(apiKey);
  }
  return nvidiaClient;
}