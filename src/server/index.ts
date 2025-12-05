import { APIRoutes } from '../api/routes';

// Load environment variables
const BING_SEARCH_API_KEY = process.env.BING_SEARCH_API_KEY || '';
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';

if (!BING_SEARCH_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
  console.error('Missing required environment variables:');
  console.error('- BING_SEARCH_API_KEY');
  console.error('- AZURE_OPENAI_ENDPOINT');
  console.error('- AZURE_OPENAI_API_KEY');
  console.error('- AZURE_OPENAI_DEPLOYMENT_NAME (optional, defaults to gpt-4)');
  process.exit(1);
}

const apiRoutes = new APIRoutes(
  BING_SEARCH_API_KEY,
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_DEPLOYMENT_NAME
);

const PORT = process.env.PORT || 3000;

// Helper to get content type
function getContentType(path: string): string {
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'application/javascript';
  if (path.endsWith('.jsx') || path.endsWith('.js')) return 'application/javascript';
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.json')) return 'application/json';
  return 'text/plain';
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Helper to send JSON response
function sendJSON(response: Response, data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// Helper to send error response
function sendError(response: Response, message: string, status: number = 500) {
  return sendJSON(response, { error: message }, status);
}

// Main server
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Search certifications
      if (path === '/api/search' && method === 'GET') {
        const query = url.searchParams.get('q');
        if (!query) {
          return sendError(new Response(), 'Query parameter "q" is required', 400);
        }

        const results = await apiRoutes.searchCertifications(query);
        return sendJSON(new Response(), { results });
      }

      // Generate test
      if (path === '/api/generate-test' && method === 'POST') {
        const body = await req.json();
        const { studyGuideUrl, certificationName, questionCount } = body;

        if (!studyGuideUrl || !certificationName) {
          return sendError(
            new Response(),
            'studyGuideUrl and certificationName are required',
            400
          );
        }

        const test = await apiRoutes.generateTest(
          studyGuideUrl,
          certificationName,
          questionCount || 40
        );
        return sendJSON(new Response(), { test });
      }

      // Get test
      if (path.startsWith('/api/test/') && method === 'GET') {
        const testId = path.split('/api/test/')[1];
        if (!testId) {
          return sendError(new Response(), 'Test ID is required', 400);
        }

        const test = await apiRoutes.getTest(testId);
        if (!test) {
          return sendError(new Response(), 'Test not found', 404);
        }

        // Remove correct answers for test-taking
        const testForTaking = {
          ...test,
          questions: test.questions.map(q => ({
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options,
            // Don't include correctAnswers or explanation
          })),
        };

        return sendJSON(new Response(), { test: testForTaking });
      }

      // Get test with answers (for results)
      if (path.startsWith('/api/test/') && path.endsWith('/answers') && method === 'GET') {
        const testId = path.split('/api/test/')[1].replace('/answers', '');
        if (!testId) {
          return sendError(new Response(), 'Test ID is required', 400);
        }

        const test = await apiRoutes.getTest(testId);
        if (!test) {
          return sendError(new Response(), 'Test not found', 404);
        }

        return sendJSON(new Response(), { test });
      }

      // Submit test answers and get score
      if (path.startsWith('/api/test/') && path.endsWith('/submit') && method === 'POST') {
        const testId = path.split('/api/test/')[1].replace('/submit', '');
        if (!testId) {
          return sendError(new Response(), 'Test ID is required', 400);
        }

        const body = await req.json();
        const { answers } = body;

        const test = await apiRoutes.getTest(testId);
        if (!test) {
          return sendError(new Response(), 'Test not found', 404);
        }

        const score = apiRoutes.calculateScore(test, answers);
        
        // Save session with answers for later retrieval
        const { TestStorage } = await import('../services/testStorage');
        const storage = new TestStorage();
        const sessionId = `session-${testId}-${Date.now()}`;
        await storage.saveSession({
          testId,
          answers,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          score: score.score,
        });
        
        // Return score with session ID and answers for results view
        return sendJSON(new Response(), { 
          score,
          sessionId,
          answers, // Include answers so results page can show them
        });
      }

      // Serve frontend
      if (path === '/' || path === '/index.html') {
        try {
          const html = await Bun.file('./index.html').text();
          return new Response(html, {
            headers: { 'Content-Type': 'text/html' },
          });
        } catch (error) {
          return new Response('Frontend not found. Please ensure index.html exists.', {
            status: 404,
            headers: { 'Content-Type': 'text/html' },
          });
        }
      }

      // Serve frontend source files (for development)
      if (path.startsWith('/src/')) {
        try {
          const file = Bun.file(`.${path}`);
          if (await file.exists()) {
            return new Response(file, {
              headers: { 'Content-Type': getContentType(path) },
            });
          }
        } catch (error) {
          // File not found, continue
        }
      }

      return sendError(new Response(), 'Not found', 404);
    } catch (error) {
      console.error('Server error:', error);
      return sendError(
        new Response(),
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  },
});

console.log(`Server running on http://localhost:${PORT}`);

