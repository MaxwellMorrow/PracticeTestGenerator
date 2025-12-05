import { ContentAnalysis } from '../types';

export class ContentAnalyzer {
  /**
   * Analyze study guide content to extract key topics and concepts
   */
  async analyzeContent(content: string, structuredContent?: {
    title: string;
    headings: string[];
    paragraphs: string[];
    lists: string[];
  }): Promise<ContentAnalysis> {
    // Extract key topics from headings and important sections
    const keyTopics: string[] = [];
    const concepts: string[] = [];
    
    if (structuredContent) {
      // Use headings as key topics
      structuredContent.headings.forEach(heading => {
        if (heading.length > 5 && heading.length < 100) {
          keyTopics.push(heading);
        }
      });
      
      // Extract concepts from lists (often contain exam objectives)
      structuredContent.lists.forEach(item => {
        if (item.length > 10 && item.length < 200) {
          concepts.push(item);
        }
      });
    }
    
    // Extract topics from content using simple heuristics
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    for (const line of lines) {
      // Look for lines that might be topics (short, capitalized, etc.)
      if (line.length > 10 && line.length < 150) {
        const trimmed = line.trim();
        // Check if it looks like a topic/heading
        if (trimmed[0] === trimmed[0].toUpperCase() && 
            !trimmed.endsWith('.') && 
            !trimmed.endsWith('?') &&
            trimmed.split(' ').length < 15) {
          if (!keyTopics.includes(trimmed)) {
            keyTopics.push(trimmed);
          }
        }
      }
    }
    
    // Limit to top 10-15 most relevant topics
    const uniqueTopics = Array.from(new Set(keyTopics)).slice(0, 15);
    
    // Generate summary (first 500 characters)
    const summary = content.substring(0, 500).replace(/\s+/g, ' ').trim();
    
    return {
      keyTopics: uniqueTopics,
      concepts: concepts.slice(0, 20),
      summary,
    };
  }

  /**
   * Extract search queries from analyzed content
   */
  extractSearchQueries(analysis: ContentAnalysis): string[] {
    // Use key topics as search queries, possibly combining with certification context
    return analysis.keyTopics.map(topic => {
      // Clean up topic for search
      return topic
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }).filter(query => query.length > 5);
  }
}

