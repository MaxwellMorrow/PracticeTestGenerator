import { OpenAIClient, AzureOpenAI } from '@azure/openai';
import { Question, PracticeTest } from '../types';

export class QuestionGenerator {
  private client: OpenAIClient;

  constructor(endpoint: string, apiKey: string, deploymentName: string) {
    this.client = new AzureOpenAI({
      endpoint,
      apiKey,
      deploymentName,
    });
  }

  /**
   * Generate practice test questions from study guide and web content
   */
  async generateQuestions(
    studyGuideContent: string,
    webContent: Array<{ title: string; snippet: string; content?: string }>,
    questionCount: number = 40
  ): Promise<Question[]> {
    // Combine all content
    const webContentText = webContent
      .map(item => `${item.title}\n${item.snippet}${item.content ? '\n' + item.content : ''}`)
      .join('\n\n---\n\n');

    const combinedContent = `
STUDY GUIDE CONTENT:
${studyGuideContent}

ADDITIONAL WEB CONTENT:
${webContentText}
`;

    // Determine mix of question types (60% multiple choice, 40% multiple select)
    const multipleChoiceCount = Math.floor(questionCount * 0.6);
    const multipleSelectCount = questionCount - multipleChoiceCount;

    const questions: Question[] = [];

    // Generate multiple choice questions
    if (multipleChoiceCount > 0) {
      const mcQuestions = await this.generateMultipleChoiceQuestions(
        combinedContent,
        multipleChoiceCount
      );
      questions.push(...mcQuestions);
    }

    // Generate multiple select questions
    if (multipleSelectCount > 0) {
      const msQuestions = await this.generateMultipleSelectQuestions(
        combinedContent,
        multipleSelectCount
      );
      questions.push(...msQuestions);
    }

    // Shuffle questions
    return this.shuffleArray(questions);
  }

  private async generateMultipleChoiceQuestions(
    content: string,
    count: number
  ): Promise<Question[]> {
    const prompt = `You are creating practice test questions for a Microsoft certification exam. Based on the following content, generate ${count} high-quality multiple-choice questions.

Each question should:
- Have exactly 4 answer options (A, B, C, D)
- Have only ONE correct answer
- Be realistic and similar to actual certification exam questions
- Test understanding of concepts, not just memorization
- Include a clear explanation for why the correct answer is right

Format your response as a JSON array with this structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Explanation of why this answer is correct"
  }
]

CONTENT TO USE:
${content.substring(0, 15000)} // Limit content size

Generate exactly ${count} questions. Return ONLY the JSON array, no other text.`;

    try {
      const response = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating certification exam practice questions. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'gpt-4', // or your deployment name
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from OpenAI');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return parsed.map((q: any, index: number) => ({
        id: `mc-${Date.now()}-${index}`,
        type: 'multiple-choice' as const,
        question: q.question,
        options: q.options,
        correctAnswers: [q.options[q.correctAnswer]],
        explanation: q.explanation,
      }));
    } catch (error) {
      console.error('Error generating multiple choice questions:', error);
      throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateMultipleSelectQuestions(
    content: string,
    count: number
  ): Promise<Question[]> {
    const prompt = `You are creating practice test questions for a Microsoft certification exam. Based on the following content, generate ${count} high-quality multiple-select questions (select all that apply).

Each question should:
- Have 4-5 answer options
- Have 2-3 correct answers (not all, not just one)
- Be realistic and similar to actual certification exam questions
- Test understanding of concepts, not just memorization
- Include a clear explanation for why the correct answers are right

Format your response as a JSON array with this structure:
[
  {
    "question": "Question text here? (Select all that apply)",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswers": [0, 2],
    "explanation": "Explanation of why these answers are correct"
  }
]

CONTENT TO USE:
${content.substring(0, 15000)} // Limit content size

Generate exactly ${count} questions. Return ONLY the JSON array, no other text.`;

    try {
      const response = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating certification exam practice questions. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from OpenAI');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return parsed.map((q: any, index: number) => ({
        id: `ms-${Date.now()}-${index}`,
        type: 'multiple-select' as const,
        question: q.question,
        options: q.options,
        correctAnswers: q.correctAnswers.map((idx: number) => q.options[idx]),
        explanation: q.explanation,
      }));
    } catch (error) {
      console.error('Error generating multiple select questions:', error);
      throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

