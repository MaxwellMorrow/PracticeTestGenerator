import React, { useState, useEffect } from 'react';

interface Question {
  id: string;
  type: 'multiple-choice' | 'multiple-select';
  question: string;
  options: string[];
  correctAnswers: string[];
  explanation: string;
}

interface Test {
  id: string;
  certificationName: string;
  questions: Question[];
}

interface ScoreDetail {
  questionId: string;
  correct: boolean;
  userAnswers: string[];
  correctAnswers: string[];
}

interface TestResultsProps {
  testId: string;
  results: {
    testId: string;
    score: number;
    total: number;
    correct: number;
    incorrect: number;
    answers?: Record<string, string[]>; // User's answers
  };
  onNewTest: () => void;
  onGenerateAnother: () => void;
}

const TestResults: React.FC<TestResultsProps> = ({
  testId,
  results,
  onNewTest,
  onGenerateAnother,
}) => {
  const [test, setTest] = useState<Test | null>(null);
  const [scoreDetails, setScoreDetails] = useState<ScoreDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTestWithAnswers();
  }, [testId]);

  const loadTestWithAnswers = async () => {
    try {
      const response = await fetch(`/api/test/${testId}/answers`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load test');
      }
      
      setTest(data.test);
      
      // Score details are already available in the results prop from TestTaking
      // No need to make an additional request
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#28a745';
    if (score >= 70) return '#ffc107';
    return '#dc3545';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent! You\'re well prepared.';
    if (score >= 80) return 'Good job! You\'re ready for the exam.';
    if (score >= 70) return 'Not bad, but more practice is recommended.';
    return 'Keep studying! Review the material and try again.';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading results...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ color: '#c00' }}>{error || 'Test not found'}</p>
        <button onClick={onNewTest}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Score Summary */}
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ margin: '0 0 1rem 0' }}>{test.certificationName}</h2>
          <div style={{
            fontSize: '4rem',
            fontWeight: 'bold',
            color: getScoreColor(results.score),
            marginBottom: '0.5rem'
          }}>
            {results.score}%
          </div>
          <p style={{ fontSize: '1.2rem', margin: '0 0 1rem 0' }}>
            {getScoreMessage(results.score)}
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginTop: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                {results.correct}
              </div>
              <div style={{ color: '#666' }}>Correct</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                {results.incorrect}
              </div>
              <div style={{ color: '#666' }}>Incorrect</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
                {results.total}
              </div>
              <div style={{ color: '#666' }}>Total</div>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div style={{ marginBottom: '2rem' }}>
          <h3>Question Review</h3>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Click on any question to see the explanation
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {test.questions.map((question, index) => {
              const isExpanded = expandedQuestions.has(question.id);
              const userAnswers = results.answers?.[question.id] || [];
              const isCorrect = userAnswers.length === question.correctAnswers.length &&
                userAnswers.every(ans => question.correctAnswers.includes(ans)) &&
                question.correctAnswers.every(ans => userAnswers.includes(ans));
              
              return (
                <div
                  key={question.id}
                  style={{
                    border: `2px solid ${isCorrect ? '#28a745' : '#dc3545'}`,
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '0.5rem'
                  }}
                >
                  <div
                    onClick={() => toggleQuestion(question.id)}
                    style={{
                      padding: '1rem',
                      backgroundColor: isExpanded ? '#f0f0f0' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isCorrect ? '#28a745' : '#dc3545',
                        color: 'white',
                        textAlign: 'center',
                        lineHeight: '24px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <div>
                        <strong>Question {index + 1}:</strong> {question.question}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.2rem' }}>
                      {isExpanded ? '−' : '+'}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '1rem', borderTop: '1px solid #ddd' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <strong>Your Answer:</strong>
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          backgroundColor: isCorrect ? '#d4edda' : '#f8d7da',
                          borderRadius: '4px',
                          border: `1px solid ${isCorrect ? '#c3e6cb' : '#f5c6cb'}`
                        }}>
                          {userAnswers.length > 0 ? userAnswers.join(', ') : '(No answer provided)'}
                        </div>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <strong>Correct Answer{question.correctAnswers.length > 1 ? 's' : ''}:</strong>
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          backgroundColor: '#d4edda',
                          borderRadius: '4px'
                        }}>
                          {question.correctAnswers.join(', ')}
                        </div>
                      </div>

                      <div>
                        <strong>Explanation:</strong>
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          backgroundColor: '#e7f3ff',
                          borderRadius: '4px'
                        }}>
                          {question.explanation}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          paddingTop: '2rem',
          borderTop: '2px solid #e0e0e0'
        }}>
          <button
            onClick={onGenerateAnother}
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
            Generate Another Test
          </button>
          <button
            onClick={onNewTest}
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
            New Certification
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResults;

