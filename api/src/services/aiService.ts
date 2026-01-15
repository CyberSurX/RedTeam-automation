import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { logger } from '../utils/logger';
import { Finding } from '../entities/Finding';

export interface AITriageResult {
  confidence: number;
  isFalsePositive: boolean;
  isDuplicate: boolean;
  explanation: string;
  recommendedSeverity: string;
}

class AIService {
  private genAI?: GoogleGenerativeAI;
  private geminiModel?: any;
  private backend: 'gemini' | 'ollama';
  private ollamaApiKey: string;
  private ollamaModel: string;

  constructor() {
    this.backend = (process.env.AI_BACKEND as 'gemini' | 'ollama') || 'ollama';
    this.ollamaApiKey = process.env.OLLAMA_API_KEY || '';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'gpt-oss:120b-cloud';

    if (this.backend === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY || '';
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  private async callOllama(prompt: string): Promise<string> {
    try {
      const response = await axios.post('https://ollama.com/api/generate', {
        model: this.ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.ollamaApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.response;
    } catch (error: any) {
      logger.error('Ollama API call failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!this.geminiModel) throw new Error('Gemini model not initialized');
    const result = await this.geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async analyzeFinding(finding: Finding): Promise<AITriageResult> {
    const prompt = `
      Analyze the following security finding and provide a triage assessment.
      
      Title: ${finding.title}
      Description: ${finding.description}
      Type: ${finding.type}
      Reported Severity: ${finding.severity}
      Technical Details: ${finding.technical_details}
      
      Provide JSON output with the following fields:
      - confidence: (0-100)
      - isFalsePositive: (boolean)
      - isDuplicate: (boolean)
      - explanation: (short string)
      - recommendedSeverity: (informational, low, medium, high, critical)
      
      Return ONLY the JSON object.
    `;

    try {
      let text = '';
      if (this.backend === 'ollama') {
        text = await this.callOllama(prompt);
      } else {
        text = await this.callGemini(prompt);
      }
      
      const jsonMatch = text.match(/\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Could not parse AI response');
    } catch (error) {
      logger.error('AI Triage failed:', error);
      return {
        confidence: 0,
        isFalsePositive: false,
        isDuplicate: false,
        explanation: 'AI analysis failed to execute.',
        recommendedSeverity: finding.severity
      };
    }
  }

  async summarizeScan(logs: string): Promise<string> {
    const prompt = `Summarize these security scan logs and provide 3 key actionable insights:\n\n${logs}`;
    try {
      if (this.backend === 'ollama') {
        return await this.callOllama(prompt);
      } else {
        return await this.callGemini(prompt);
      }
    } catch (error) {
       logger.error('AI Summary failed:', error);
       return 'Unable to generate AI insights at this time.';
    }
  }
}

export const aiService = new AIService();
