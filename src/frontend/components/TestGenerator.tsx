import React, { useState, useEffect } from 'react';

interface TestGeneratorProps {
  studyGuideUrl: string;
  certificationName: string;
  defaultQuestionCount: number;
  onTestGenerated: (test: { id: string; certificationName: string; questionCount: number }) => void;
  onCancel: () => void;
}

const TestGenerator: React.FC<TestGeneratorProps> = ({
  studyGuideUrl,
  certificationName,
  defaultQuestionCount,
  onTestGenerated,
  onCancel,
}) => {
  const [questionCount, setQuestionCount] = useState(defaultQuestionCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  useEffect(() => {
    // Auto-start generation when component mounts
    handleGenerate();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setProgress('Initializing test generation...');

    try {
      // studyGuideUrl should be the actual URL from search or user input
      let url = studyGuideUrl;
      let name = certificationName;

      // If studyGuideUrl doesn't look like a URL, try to search for it
      if (!studyGuideUrl.startsWith('http')) {
        setProgress('Searching for study guide...');
        const searchResponse = await fetch(`/api/search?q=${encodeURIComponent(studyGuideUrl)}`);
        const searchData = await searchResponse.json();
        if (searchData.results && searchData.results.length > 0) {
          url = searchData.results[0].url;
          name = searchData.results[0].title;
        } else {
          throw new Error('No study guide found. Please try a different search term or provide a direct URL.');
        }
      }

      setProgress('Extracting study guide content...');
      
      const response = await fetch('/api/generate-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studyGuideUrl: url,
          certificationName: name,
          questionCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate test');
      }

      setProgress('Test generated successfully!');
      onTestGenerated({
        id: data.test.id,
        certificationName: data.test.certificationName || name,
        questionCount: data.test.questionCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0 }}>Generate Practice Test</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <p><strong>Certification:</strong> {certificationName}</p>
        </div>

        {!loading && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Number of Questions:
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 40)}
              style={{
                padding: '0.5rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                width: '150px'
              }}
            />
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Default is 40 questions. You can increase this to generate more practice questions.
            </p>
          </div>
        )}

        {loading && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              padding: '1rem',
              backgroundColor: '#e3f2fd',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              <p style={{ margin: 0 }}><strong>Status:</strong> {progress}</p>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#0078d4',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            </div>
          </div>
        )}

        {error && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        {!loading && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleGenerate}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: '#0078d4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Generate Test
            </button>
            <button
              onClick={onCancel}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestGenerator;

