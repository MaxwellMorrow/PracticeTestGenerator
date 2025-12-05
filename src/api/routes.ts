import { BingSearchService } from '../services/bingSearch';
import { ContentExtractor } from '../services/contentExtractor';
import { ContentAnalyzer } from '../services/contentAnalyzer';
import { QuestionGenerator } from '../services/questionGenerator';
import { TestStorage } from '../services/testStorage';
import { PracticeTest, CertificationSearchResult } from '../types';

export class APIRoutes {
  private bingSearch: BingSearchService;
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
    this.bingSearch = new BingSearchService(bingApiKey);
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
    const structuredContent = this.contentExtractor.extractStructuredContent(
      await fetch(studyGuideUrl).then(r => r.text())
    );

    // Step 2: Analyze content to find key topics
    console.log('Step 2: Analyzing content for key topics...');
    const analysis = await this.contentAnalyzer.analyzeContent(
      studyGuideContent,
      structuredContent
    );

    // Step 3: Search web for related content based on topics
    console.log('Step 3: Searching web for related content...');
    const searchQueries = this.contentAnalyzer.extractSearchQueries(analysis);
    const webContent = await this.bingSearch.searchRelatedContent(searchQueries, 10);

    // Step 4: Fetch full content from web results (limit to avoid timeout)
    console.log('Step 4: Fetching content from web results...');
    const webContentWithFullText = await Promise.all(
      webContent.slice(0, 5).map(async (item) => {
        try {
          const fullContent = await this.contentExtractor.fetchContent(item.url);
          return {
            ...item,
            content: fullContent.substring(0, 2000), // Limit content size
          };
        } catch (error) {
          console.warn(`Failed to fetch content from ${item.url}:`, error);
          return item; // Return with just snippet
        }
      })
    );

    // Step 5: Generate questions from combined content
    console.log('Step 5: Generating questions...');
    const questions = await this.questionGenerator.generateQuestions(
      studyGuideContent,
      webContentWithFullText,
      questionCount
    );

    // Step 6: Create and save test
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

