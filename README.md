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
- Azure OpenAI endpoint, API key, and deployment name
- (Optional) Azure Bing Search API key - only needed if you want to use the search functionality

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
   PORT=3000
   
   # Optional - only needed if you want to use search functionality
   # BING_SEARCH_API_KEY=your_bing_search_api_key_here
   ```

3. **Get Azure API Keys:**
   - **Azure OpenAI**: Get your endpoint and key from [Azure OpenAI Studio](https://oai.azure.com/)
   - **(Optional) Bing Search API**: Get your key from [Azure Portal](https://portal.azure.com) → Create a Bing Search v7 resource (only needed for search functionality)

## Running the Application

1. **Start the server:**
   ```bash
   bun run dev
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

1. **Find Your Study Guide:**
   - **Option A (with Bing Search)**: Enter a certification name (e.g., "AZ-900 Azure Fundamentals") to search
   - **Option B (no search needed)**: Paste a Microsoft Learn URL directly

2. **Generate Test:**
   - If using search, select a study guide from results
   - Configure the number of questions (default: 40)
   - Wait for the system to:
     - Extract study guide content
     - Generate practice questions from the study guide

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
2. **Question Generation**: Uses Azure OpenAI to generate practice questions directly from the study guide content
3. **Test Storage**: Saves generated tests locally for later retrieval
4. **Scoring**: Calculates scores and provides detailed feedback

**Note**: Web search functionality has been removed to reduce costs. Questions are generated from the study guide content only. If you have a Bing Search API key, you can optionally enable search functionality by setting `BING_SEARCH_API_KEY` in your `.env` file.

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

- **Missing environment variables**: Ensure Azure OpenAI API keys are set in `.env` (Bing Search is optional)
- **API errors**: Check that your Azure OpenAI API keys are valid and have proper permissions
- **Content extraction fails**: Some Microsoft Learn pages may have different structures; the extractor will try multiple selectors
- **Search not working**: If you want to use search, ensure `BING_SEARCH_API_KEY` is set in your `.env` file. Otherwise, use direct Microsoft Learn URLs.

## License

Private project for personal use.
