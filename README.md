# Microsoft Certification Practice Test Generator

A full-stack application that generates practice tests for Microsoft certifications by:
1. Extracting content from Microsoft Learn study guides
2. Analyzing the content to identify key topics
3. Searching the web for additional related content
4. Using AI to generate comprehensive practice questions

## Features

- **Smart Content Gathering**: Analyzes study guides and finds related web content for comprehensive question generation
- **Configurable Question Count**: Default 40 questions with option to increase
- **Mixed Question Types**: Multiple choice and multiple select questions
- **Interactive Test Interface**: Clean UI with question navigation, timer, and answer tracking
- **Detailed Results**: Score breakdown with explanations for each question
- **Multiple Test Generation**: Generate multiple practice tests to gauge exam readiness

## Prerequisites

- [Bun](https://bun.sh) runtime (v1.3.3 or later)
- Azure Bing Search API key
- Azure OpenAI endpoint, API key, and deployment name

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   BING_SEARCH_API_KEY=your_bing_search_api_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
   PORT=3000
   ```

3. **Get Azure API Keys:**
   - **Bing Search API**: Get your key from [Azure Portal](https://portal.azure.com) → Create a Bing Search v7 resource
   - **Azure OpenAI**: Get your endpoint and key from [Azure OpenAI Studio](https://oai.azure.com/)

## Running the Application

1. **Start the server:**
   ```bash
   bun run dev
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

1. **Search for Certification:**
   - Enter a certification name (e.g., "AZ-900 Azure Fundamentals") or
   - Paste a Microsoft Learn URL directly

2. **Generate Test:**
   - Select a study guide from search results
   - Configure the number of questions (default: 40)
   - Wait for the system to:
     - Extract study guide content
     - Analyze key topics
     - Search for related web content
     - Generate practice questions

3. **Take the Test:**
   - Answer questions (answers are hidden)
   - Navigate between questions
   - Submit when ready

4. **Review Results:**
   - View your score and performance
   - Review explanations for each question
   - Generate another test or start over

## Project Structure

```
├── src/
│   ├── server/          # Bun HTTP server
│   ├── api/             # API route handlers
│   ├── services/        # Business logic services
│   │   ├── bingSearch.ts
│   │   ├── contentExtractor.ts
│   │   ├── contentAnalyzer.ts
│   │   ├── questionGenerator.ts
│   │   └── testStorage.ts
│   ├── types/           # TypeScript type definitions
│   └── frontend/        # React components
│       ├── components/
│       │   ├── SearchCertification.tsx
│       │   ├── TestGenerator.tsx
│       │   ├── TestTaking.tsx
│       │   └── TestResults.tsx
│       ├── App.tsx
│       └── index.tsx
├── data/
│   └── tests/           # Generated tests storage
├── index.html           # Frontend entry point
└── package.json
```

## How It Works

1. **Content Extraction**: Uses web scraping to extract text content from Microsoft Learn pages
2. **Content Analysis**: Analyzes the study guide to identify key topics, concepts, and important sections
3. **Web Search**: Searches the web for additional content related to identified topics
4. **Question Generation**: Uses Azure OpenAI to generate practice questions from the combined content (study guide + web content)
5. **Test Storage**: Saves generated tests locally for later retrieval
6. **Scoring**: Calculates scores and provides detailed feedback

## API Endpoints

- `GET /api/search?q={query}` - Search for certifications
- `POST /api/generate-test` - Generate a practice test
- `GET /api/test/{testId}` - Get test (without answers)
- `GET /api/test/{testId}/answers` - Get test with answers
- `POST /api/test/{testId}/submit` - Submit answers and get score

## Notes

- Generated tests are stored in `data/tests/` directory
- Test sessions are stored in `data/tests/sessions/`
- The application uses Bun's built-in bundler for serving React components
- Questions are generated using Azure OpenAI (GPT-4 recommended)

## Troubleshooting

- **Missing environment variables**: Ensure all required API keys are set in `.env`
- **API errors**: Check that your Azure API keys are valid and have proper permissions
- **Content extraction fails**: Some Microsoft Learn pages may have different structures; the extractor will try multiple selectors

## License

Private project for personal use.
