import { WebSearchClient } from '@azure/cognitiveservices-websearch';
import { CognitiveServicesCredentials } from '@azure/ms-rest-js';

export class BingSearchService {
  private client: WebSearchClient;

  constructor(apiKey: string) {
    const credentials = new CognitiveServicesCredentials(apiKey);
    this.client = new WebSearchClient(credentials);
  }

  /**
   * Search for Microsoft Learn certification study guides
   */
  async searchCertification(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
    try {
      const searchQuery = `site:learn.microsoft.com ${query} certification study guide`;
      const result = await this.client.web.search(searchQuery, {
        count: 10,
        responseFilter: ['WebPages'],
      });

      const results: Array<{ title: string; url: string; snippet: string }> = [];

      if (result.webPages?.value) {
        for (const page of result.webPages.value) {
          results.push({
            title: page.name || '',
            url: page.url || '',
            snippet: page.snippet || '',
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Bing Search error:', error);
      throw new Error(`Failed to search for certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search the web for additional content related to study guide topics
   */
  async searchRelatedContent(topics: string[], limit: number = 5): Promise<Array<{ title: string; url: string; snippet: string; content?: string }>> {
    const allResults: Array<{ title: string; url: string; snippet: string; content?: string }> = [];

    try {
      // Search for each topic
      for (const topic of topics.slice(0, limit)) {
        const searchQuery = `${topic} Microsoft Azure certification`;
        const result = await this.client.web.search(searchQuery, {
          count: 3,
          responseFilter: ['WebPages'],
        });

        if (result.webPages?.value) {
          for (const page of result.webPages.value) {
            // Avoid duplicates
            if (!allResults.find(r => r.url === page.url)) {
              allResults.push({
                title: page.name || '',
                url: page.url || '',
                snippet: page.snippet || '',
              });
            }
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return allResults;
    } catch (error) {
      console.error('Bing Search related content error:', error);
      // Return partial results if available
      return allResults;
    }
  }
}

