import React, { useState, useEffect } from 'react';

interface Question {
  id: string;
  type: 'multiple-choice' | 'multiple-select';
  question: string;
  options: string[];
}

interface Test {
  id: string;
  certificationName: string;
  questionCount: number;
  questions: Question[];
}

interface TestTakingProps {
  testId: string;
  onTestSubmitted: (results: {
    testId: string;
    score: number;
    total: number;
    correct: number;
    incorrect: number;
  }) => void;
  onCancel: () => void;
}

const TestTaking: React.FC<TestTakingProps> = ({ testId, onTestSubmitted, onCancel }) => {
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTest();
  }, [testId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadTest = async () => {
    try {
      const response = await fetch(`/api/test/${testId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load test');
      }
      
      setTest(data.test);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, option: string, isMultiple: boolean) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      
      if (isMultiple) {
        // Multiple select: toggle option
        if (currentAnswers.includes(option)) {
          return {
            ...prev,
            [questionId]: currentAnswers.filter(a => a !== option),
          };
        } else {
          return {
            ...prev,
            [questionId]: [...currentAnswers, option],
          };
        }
      } else {
        // Multiple choice: single selection
        return {
          ...prev,
          [questionId]: [option],
        };
      }
    });
  };

  const handleSubmit = async () => {
    if (!test) return;
    
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < test.questions.length) {
      if (!confirm(`You have only answered ${answeredCount} out of ${test.questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/test/${testId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit test');
      }

      onTestSubmitted({
        testId,
        score: data.score.score,
        total: data.score.total,
        correct: data.score.correct,
        incorrect: data.score.incorrect,
        answers: data.answers, // Include user answers for results view
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading test...</p>
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
        <button onClick={onCancel}>Go Back</button>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const currentAnswers = answers[currentQuestion.id] || [];
  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid #e0e0e0'
        }}>
          <div>
            <h2 style={{ margin: 0 }}>{test.certificationName}</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
              Question {currentQuestionIndex + 1} of {test.questions.length}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {formatTime(timeElapsed)}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              {answeredCount} / {test.questions.length} answered
            </div>
          </div>
        </div>

        {/* Question */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>
            {currentQuestion.question}
            {currentQuestion.type === 'multiple-select' && (
              <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                (Select all that apply)
              </span>
            )}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = currentAnswers.includes(option);
              return (
                <label
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '1rem',
                    border: `2px solid ${isSelected ? '#0078d4' : '#ddd'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#e3f2fd' : 'white',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#0078d4';
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#ddd';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <input
                    type={currentQuestion.type === 'multiple-select' ? 'checkbox' : 'radio'}
                    checked={isSelected}
                    onChange={() => handleAnswerChange(
                      currentQuestion.id,
                      option,
                      currentQuestion.type === 'multiple-select'
                    )}
                    style={{ marginRight: '1rem', marginTop: '0.25rem' }}
                  />
                  <span style={{ flex: 1 }}>{option}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '2px solid #e0e0e0'
        }}>
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: currentQuestionIndex === 0 ? '#ccc' : '#0078d4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {test.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                style={{
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  border: `2px solid ${answers[test.questions[index].id] ? '#0078d4' : '#ddd'}`,
                  borderRadius: '4px',
                  backgroundColor: index === currentQuestionIndex ? '#0078d4' : 'white',
                  color: index === currentQuestionIndex ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                title={`Question ${index + 1}${answers[test.questions[index].id] ? ' (answered)' : ''}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex < test.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(test.questions.length - 1, prev + 1))}
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
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: submitting ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          )}
        </div>

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
      </div>
    </div>
  );
};

export default TestTaking;

