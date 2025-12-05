import * as cheerio from 'cheerio';

export class ContentExtractor {
  /**
   * Extract text content from HTML
   */
  async extractContent(html: string, url: string): Promise<string> {
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style, nav, footer, header, aside').remove();
    
    // Extract main content - Microsoft Learn typically uses specific selectors
    let content = '';
    
    // Try common Microsoft Learn content selectors
    const contentSelectors = [
      'main article',
      'article',
      '.content',
      '#main-content',
      'main',
      'body'
    ];
    
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }
    
    // Fallback to body if no specific content found
    if (!content) {
      content = $('body').text();
    }
    
    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    return content;
  }

  /**
   * Extract structured information from Microsoft Learn page
   */
  extractStructuredContent(html: string): {
    title: string;
    headings: string[];
    paragraphs: string[];
    lists: string[];
  } {
    const $ = cheerio.load(html);
    
    const title = $('h1').first().text().trim() || 
                  $('title').text().trim() ||
                  '';
    
    const headings: string[] = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const text = $(el).text().trim();
      if (text) headings.push(text);
    });
    
    const paragraphs: string[] = [];
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 20) paragraphs.push(text);
    });
    
    const lists: string[] = [];
    $('ul li, ol li').each((_, el) => {
      const text = $(el).text().trim();
      if (text) lists.push(text);
    });
    
    return { title, headings, paragraphs, lists };
  }

  /**
   * Fetch content from URL
   */
  async fetchContent(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      
      const html = await response.text();
      return await this.extractContent(html, url);
    } catch (error) {
      console.error(`Error fetching content from ${url}:`, error);
      throw error;
    }
  }
}

