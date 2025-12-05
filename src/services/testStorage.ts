import { PracticeTest, TestSession } from '../types';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export class TestStorage {
  private storageDir: string;

  constructor(storageDir: string = './data/tests') {
    this.storageDir = storageDir;
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists() {
    if (!existsSync(this.storageDir)) {
      await mkdir(this.storageDir, { recursive: true });
    }
  }

  /**
   * Save a practice test
   */
  async saveTest(test: PracticeTest): Promise<void> {
    await this.ensureDirectoryExists();
    const filePath = join(this.storageDir, `${test.id}.json`);
    await writeFile(filePath, JSON.stringify(test, null, 2), 'utf-8');
  }

  /**
   * Load a practice test by ID
   */
  async loadTest(testId: string): Promise<PracticeTest | null> {
    const filePath = join(this.storageDir, `${testId}.json`);
    
    try {
      if (!existsSync(filePath)) {
        return null;
      }
      
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as PracticeTest;
    } catch (error) {
      console.error(`Error loading test ${testId}:`, error);
      return null;
    }
  }

  /**
   * List all tests
   */
  async listTests(): Promise<PracticeTest[]> {
    await this.ensureDirectoryExists();
    // This is a simple implementation - in production, you might want to maintain an index
    const tests: PracticeTest[] = [];
    
    // For now, we'll need to track test IDs separately or scan the directory
    // This is a simplified version - you might want to add an index file
    return tests;
  }

  /**
   * Save a test session
   */
  async saveSession(session: TestSession): Promise<void> {
    await this.ensureDirectoryExists();
    const sessionsDir = join(this.storageDir, 'sessions');
    if (!existsSync(sessionsDir)) {
      await mkdir(sessionsDir, { recursive: true });
    }
    
    const filePath = join(sessionsDir, `${session.testId}-${Date.now()}.json`);
    await writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
  }

  /**
   * Get the most recent session for a test
   */
  async getLatestSession(testId: string): Promise<TestSession | null> {
    const sessionsDir = join(this.storageDir, 'sessions');
    if (!existsSync(sessionsDir)) {
      return null;
    }

    // In a production system, you'd maintain an index
    // For now, we'll return null and handle it differently
    return null;
  }
}

