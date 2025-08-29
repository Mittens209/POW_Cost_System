import React, { useState } from 'react';

const TestPage = () => {
  const [buttonText, setButtonText] = useState('Test Button');
  const [clickCount, setClickCount] = useState(0);

  const handleButtonClick = () => {
    console.log('Button clicked!');
    setClickCount(prev => prev + 1);
    setButtonText(`Clicked ${clickCount + 1} times!`);
    
    // Show an alert to confirm the button works
    alert('Button is working! Click count: ' + (clickCount + 1));
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ color: '#333', marginBottom: '1rem' }}>✅ App is Working!</h1>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            If you can see this page, the React app is loading correctly.
          </p>
          
          {/* Debug Info */}
          <div style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '1rem', 
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '14px'
          }}>
            <strong>Debug Info:</strong><br/>
            • React Version: {React.version}<br/>
            • Click Count: {clickCount}<br/>
            • Current Time: {new Date().toLocaleTimeString()}
          </div>

          <button 
            onClick={handleButtonClick}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              marginRight: '1rem'
            }}
          >
            {buttonText}
          </button>

          <button 
            onClick={() => {
              console.log('Opening main app...');
              window.location.href = '/app';
            }}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Go to Main App
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
