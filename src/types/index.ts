export interface Question {
  id: string;
  type: 'multiple-choice' | 'multiple-select';
  question: string;
  options: string[];
  correctAnswers: string[]; // Array of option indices or values
  explanation: string;
}

export interface PracticeTest {
  id: string;
  certificationName: string;
  certificationUrl?: string;
  generatedAt: string;
  questionCount: number;
  questions: Question[];
}

export interface TestSession {
  testId: string;
  answers: Record<string, string[]>; // questionId -> selected answers
  startedAt: string;
  completedAt?: string;
  score?: number;
}

export interface CertificationSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ContentAnalysis {
  keyTopics: string[];
  concepts: string[];
  summary: string;
}

