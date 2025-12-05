import React, { useState } from 'react';

interface SearchCertificationProps {
  onSelectCertification: (url: string, name: string) => void;
}

const SearchCertification: React.FC<SearchCertificationProps> = ({ onSelectCertification }) => {
  const [query, setQuery] = useState('');
  const [url, setUrl] = useState('');
  const [searchMode, setSearchMode] = useState<'name' | 'url'>('name');
  const [results, setResults] = useState<Array<{ title: string; url: string; snippet: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (searchMode === 'name' && !query.trim()) {
      setError('Please enter a certification name');
      return;
    }
    if (searchMode === 'url' && !url.trim()) {
      setError('Please enter a Microsoft Learn URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (searchMode === 'name') {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Search failed');
        }
        
        setResults(data.results || []);
      } else {
        // For URL mode, validate it's a Microsoft Learn URL and use it directly
        if (!url.includes('learn.microsoft.com')) {
          setError('Please enter a valid Microsoft Learn URL');
          setLoading(false);
          return;
        }
        
        // Extract certification name from URL or use a default
        const urlParts = url.split('/');
        const name = urlParts[urlParts.length - 1] || 'Certification';
        onSelectCertification(url, name);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      // If search is not available, provide helpful message
      if (errorMessage.includes('Search functionality') || errorMessage.includes('503')) {
        setError('Search is not available. Please use the "Enter Microsoft Learn URL" option below and paste a direct link to the study guide.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (resultUrl: string, resultName: string) => {
    onSelectCertification(resultUrl, resultName);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
          Find Your Certification Study Guide
        </h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="radio"
              checked={searchMode === 'name'}
              onChange={() => {
                setSearchMode('name');
                setResults([]);
                setError(null);
              }}
            />
            <span>Search by Certification Name</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="radio"
              checked={searchMode === 'url'}
              onChange={() => {
                setSearchMode('url');
                setResults([]);
                setError(null);
              }}
            />
            <span>Enter Microsoft Learn URL</span>
          </label>
        </div>

        {searchMode === 'name' ? (
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., AZ-900 Azure Fundamentals"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="https://learn.microsoft.com/..."
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Searching...' : searchMode === 'name' ? 'Search' : 'Continue'}
        </button>

        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Search Results:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectResult(result.url, result.title)}
                  style={{
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#0078d4' }}>
                    {result.title}
                  </h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                    {result.snippet}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>
                    {result.url}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchCertification;

