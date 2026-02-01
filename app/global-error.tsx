'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('=== GLOBAL ERROR (ROOT LAYOUT) ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error digest:', error.digest);
    console.error('==================================');
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        margin: 0,
      }}>
        <div style={{
          maxWidth: '32rem',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            backgroundColor: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <svg
              style={{ width: '2rem', height: '2rem', color: '#dc2626' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#0f172a',
            marginBottom: '0.5rem',
          }}>
            Something went wrong
          </h1>

          <p style={{
            color: '#64748b',
            marginBottom: '1rem',
          }}>
            A critical error occurred. Please try again.
          </p>

          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
            overflow: 'auto',
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              marginBottom: '0.25rem',
              marginTop: 0,
            }}>
              Error:
            </p>
            <code style={{
              fontSize: '0.875rem',
              color: '#f87171',
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap',
            }}>
              {error.name}: {error.message || 'Unknown error'}
            </code>
            {error.stack && (
              <>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginTop: '0.75rem',
                  marginBottom: '0.25rem',
                }}>
                  Stack trace:
                </p>
                <code style={{
                  fontSize: '0.75rem',
                  color: '#cbd5e1',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  display: 'block',
                  maxHeight: '10rem',
                  overflow: 'auto',
                }}>
                  {error.stack}
                </code>
              </>
            )}
          </div>

          {error.digest && (
            <p style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              marginBottom: '1rem',
              fontFamily: 'monospace',
            }}>
              Error ID: {error.digest}
            </p>
          )}

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={reset}
              style={{
                backgroundColor: '#1e3a5f',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                backgroundColor: 'white',
                color: '#1e3a5f',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
