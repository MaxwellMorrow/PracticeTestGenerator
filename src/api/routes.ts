import { BingSearchService } from '../services/bingSearch';
import { ContentExtractor } from '../services/contentExtractor';
import { ContentAnalyzer } from '../services/contentAnalyzer';
import { QuestionGenerator } from '../services/questionGenerator';
import { TestStorage } from '../services/testStorage';
import type { PracticeTest, CertificationSearchResult } from '../types';

export class APIRoutes {
  private bingSearch: BingSearchService | null;
  private contentExtractor: ContentExtractor;
  private contentAnalyzer: ContentAnalyzer;
  private questionGenerator: QuestionGenerator;
  private testStorage: TestStorage;

  constructor(
    bingApiKey: string,
    openaiEndpoint: string,
    openaiApiKey: string,
    openaiDeploymentName: string
  ) {
    // Only initialize Bing Search if API key is provided
    this.bingSearch = bingApiKey ? new BingSearchService(bingApiKey) : null;
    this.contentExtractor = new ContentExtractor();
    this.contentAnalyzer = new ContentAnalyzer();
    this.questionGenerator = new QuestionGenerator(
      openaiEndpoint,
      openaiApiKey,
      openaiDeploymentName
    );
    this.testStorage = new TestStorage();
  }

  /**
   * Search for certifications
   */
  async searchCertifications(query: string): Promise<CertificationSearchResult[]> {
    if (!this.bingSearch) {
      // Fallback: return empty results or implement alternative search
      throw new Error('Search functionality requires Bing Search API key. Please provide a direct Microsoft Learn URL instead.');
    }
    const results = await this.bingSearch.searchCertification(query);
    return results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
    }));
  }

  /**
   * Generate a practice test from a study guide URL
   */
  async generateTest(
    studyGuideUrl: string,
    certificationName: string,
    questionCount: number = 40
  ): Promise<PracticeTest> {
    // Step 1: Extract study guide content
    console.log('Step 1: Extracting study guide content...');
    const studyGuideContent = await this.contentExtractor.fetchContent(studyGuideUrl);

    // Step 2: Generate questions directly from study guide content
    console.log('Step 2: Generating questions from study guide...');
    const questions = await this.questionGenerator.generateQuestions(
      studyGuideContent,
      [], // Empty web content array - web search removed for cost savings
      questionCount
    );

    // Step 3: Create and save test
    const test: PracticeTest = {
      id: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      certificationName,
      certificationUrl: studyGuideUrl,
      generatedAt: new Date().toISOString(),
      questionCount: questions.length,
      questions,
    };

    await this.testStorage.saveTest(test);
    console.log(`Test generated and saved: ${test.id}`);

    return test;
  }

  /**
   * Get a test by ID
   */
  async getTest(testId: string): Promise<PracticeTest | null> {
    return await this.testStorage.loadTest(testId);
  }

  /**
   * Calculate test score
   */
  calculateScore(test: PracticeTest, answers: Record<string, string[]>): {
    score: number;
    total: number;
    correct: number;
    incorrect: number;
    details: Array<{ questionId: string; correct: boolean; userAnswers: string[]; correctAnswers: string[] }>;
  } {
    let correct = 0;
    const details: Array<{ questionId: string; correct: boolean; userAnswers: string[]; correctAnswers: string[] }> = [];

    for (const question of test.questions) {
      const userAnswers = answers[question.id] || [];
      const correctAnswers = question.correctAnswers;

      // Sort arrays for comparison
      const userSorted = [...userAnswers].sort().join(',');
      const correctSorted = [...correctAnswers].sort().join(',');

      const isCorrect = userSorted === correctSorted;
      if (isCorrect) correct++;

      details.push({
        questionId: question.id,
        correct: isCorrect,
        userAnswers,
        correctAnswers,
      });
    }

    return {
      score: Math.round((correct / test.questions.length) * 100),
      total: test.questions.length,
      correct,
      incorrect: test.questions.length - correct,
      details,
    };
  }
}

