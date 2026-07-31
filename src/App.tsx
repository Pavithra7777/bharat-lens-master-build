import React, { useState, useEffect } from 'react';

// Simple test app - minimal version to debug
export default function App() {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus('App mounted successfully!');
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1B3A6B 0%, #2A4A8B 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #1B3A6B 0%, #2A4A8B 100%)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '40px'
        }}>
          🇮🇳
        </div>
        
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1A1A2E',
          marginBottom: '8px'
        }}>
          Bharat Lens
        </h1>
        
        <p style={{
          fontSize: '14px',
          color: '#64748B',
          marginBottom: '24px'
        }}>
          One AI. Every Citizen. Every Service.
        </p>
        
        <div style={{
          background: error ? '#FEE2E2' : '#ECFDF5',
          color: error ? '#DC2626' : '#059669',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          {error || status}
        </div>
        
        <div style={{
          fontSize: '12px',
          color: '#94A3B8',
          marginTop: '16px'
        }}>
          App is loading... Please wait.
        </div>
      </div>
    </div>
  );
}
