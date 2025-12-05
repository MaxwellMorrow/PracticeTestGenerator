import React, { useState } from 'react';
import SearchCertification from './components/SearchCertification';
import TestGenerator from './components/TestGenerator';
import TestTaking from './components/TestTaking';
import TestResults from './components/TestResults';

type AppState = 'search' | 'generating' | 'taking' | 'results';

interface TestData {
  id: string;
  certificationName: string;
  studyGuideUrl: string; // Store URL separately
  questionCount: number;
}

interface ResultsData {
  testId: string;
  score: number;
  total: number;
  correct: number;
  incorrect: number;
  answers?: Record<string, string[]>;
}

function App() {
  const [state, setState] = useState<AppState>('search');
  const [testData, setTestData] = useState<TestData | null>(null);
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);

  const handleTestGenerated = (test: TestData) => {
    setTestData(test);
    setState('taking');
  };

  const handleTestSubmitted = (results: ResultsData) => {
    setResultsData(results);
    setState('results');
  };

  const handleNewTest = () => {
    setState('search');
    setTestData(null);
    setResultsData(null);
  };

  const handleGenerateAnother = () => {
    if (testData) {
      setState('generating');
      setResultsData(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{
        backgroundColor: '#0078d4',
        color: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
          Microsoft Certification Practice Test Generator
        </h1>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {state === 'search' && (
          <SearchCertification
            onSelectCertification={(url, name) => {
              // Store both URL and name properly
              setTestData({ 
                id: '', 
                certificationName: name, // Store the actual name
                studyGuideUrl: url, // Store URL separately
                questionCount: 40 
              });
              setState('generating');
            }}
          />
        )}

        {state === 'generating' && testData && (
          <TestGenerator
            studyGuideUrl={testData.studyGuideUrl}
            certificationName={testData.certificationName}
            defaultQuestionCount={testData.questionCount}
            onTestGenerated={handleTestGenerated}
            onCancel={() => setState('search')}
          />
        )}

        {state === 'taking' && testData && (
          <TestTaking
            testId={testData.id}
            onTestSubmitted={handleTestSubmitted}
            onCancel={() => setState('search')}
          />
        )}

        {state === 'results' && resultsData && testData && (
          <TestResults
            testId={testData.id}
            results={resultsData}
            onNewTest={handleNewTest}
            onGenerateAnother={handleGenerateAnother}
          />
        )}
      </main>
    </div>
  );
}

export default App;

