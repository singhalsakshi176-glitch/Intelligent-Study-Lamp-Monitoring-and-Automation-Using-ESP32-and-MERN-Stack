import { useState, useEffect, useCallback } from 'react';
import './App.css';
import WeeklyChart from './components/WeeklyChart';

const API_URL = 'http://localhost:5001/api';

function App() {
  const [lampOn, setLampOn] = useState(false);
  const [brightness, setBrightness] = useState(70);
  const [studyMinutes, setStudyMinutes] = useState(0);
  const [mode, setMode] = useState('Auto');
  const [ambientLight] = useState(null);
  const [studentPresence] = useState(null);
  const [connection, setConnection] = useState('Checking...');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch current lamp status from backend
  const fetchLampStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/lamp/status`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (typeof data.isOn === 'boolean') {
        setLampOn(data.isOn);
      } else if (typeof data.ison === 'boolean') {
        setLampOn(data.ison);
      }

      if (typeof data.elapsedMinutes === 'number') {
        setStudyMinutes(data.elapsedMinutes);
      }

      setConnection('Backend Connected');
      setError('');
    } catch (err) {
      setConnection('Backend Disconnected');
      setError(
        'Backend se connection nahi ho raha. Check karo ki server port 5001 par chal raha hai.'
      );
      console.error('Lamp status error:', err);
    }
  }, []);

  // Check backend health and lamp status
  useEffect(() => {
    let isMounted = true;

    async function checkBackend() {
      try {
        const response = await fetch(`${API_URL}/health`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (isMounted) {
          console.log('Backend connected:', data);
          setConnection('Backend Connected');
          setError('');
          await fetchLampStatus();
        }
      } catch (err) {
        if (isMounted) {
          setConnection('Backend Disconnected');
          setError(
            'Backend connect nahi hua. Server ko port 5001 par run karo.'
          );
          console.error('Backend connection error:', err);
        }
      }
    }

    checkBackend();

    const interval = setInterval(() => {
      if (isMounted) {
        fetchLampStatus();
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchLampStatus]);

  // Turn lamp ON or OFF using backend APIs
  const toggleLamp = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = lampOn ? 'off' : 'on';

      const response = await fetch(`${API_URL}/lamp/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: 'esp32-lamp-01',
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Lamp command failed');
      }

      if (endpoint === 'on') {
        setLampOn(true);
      } else {
        setLampOn(false);

        if (data.session?.durationMinutes != null) {
          setStudyMinutes(data.session.durationMinutes);
        }
      }

      await fetchLampStatus();
    } catch (err) {
      setError(`Lamp control error: ${err.message}`);
      console.error('Lamp control error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4f7fb',
        color: '#1e293b',
        fontFamily: 'Arial, sans-serif',
        padding: '30px',
        boxSizing: 'border-box',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>💡 Smart Study Lamp</h1>
        <p>Intelligent Study Lamp Monitoring and Automation</p>
      </header>

      {error && (
        <p
          role="alert"
          style={{
            color: '#b91c1c',
            background: '#fee2e2',
            padding: '12px',
            borderRadius: '8px',
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '20px',
        }}
      >
        <section style={cardStyle}>
          <h2>💡 Lamp Control</h2>

          <p>
            Status: <strong>{lampOn ? 'ON' : 'OFF'}</strong>
          </p>

          <button
            onClick={toggleLamp}
            disabled={loading || connection !== 'Backend Connected'}
            style={{
              ...buttonStyle,
              opacity:
                loading || connection !== 'Backend Connected' ? 0.6 : 1,
            }}
          >
            {loading
              ? 'Please wait...'
              : lampOn
                ? 'Turn Lamp OFF'
                : 'Turn Lamp ON'}
          </button>

          <p>Mode</p>

          <select
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            style={inputStyle}
          >
            <option value="Auto">Auto</option>
            <option value="Manual">Manual</option>
          </select>
        </section>

        <section style={cardStyle}>
          <h2>☀️ Brightness</h2>
          <h3>{brightness}%</h3>

          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={(event) =>
              setBrightness(Number(event.target.value))
            }
            style={{ width: '100%' }}
          />

          <p>Adjust the brightness level.</p>
          <small>
            Dashboard preview only; hardware control is not configured yet.
          </small>
        </section>

        <section style={cardStyle}>
          <h2>📚 Study Session</h2>
          <h3>{studyMinutes} minutes</h3>
          <p>Study time is read from the backend when available.</p>
        </section>

        <section style={cardStyle}>
          <h2>📡 Sensor Monitoring</h2>

          <p>
            Ambient Light:{' '}
            {ambientLight === null ? 'Awaiting sensor' : ambientLight}
          </p>

          <p>
            Student Presence:{' '}
            {studentPresence === null
              ? 'Awaiting sensor'
              : studentPresence}
          </p>

          <p>Connection: {connection}</p>
          <small>
            ESP32 hardware is not connected yet. Sensor values will be
            available after hardware integration.
          </small>
        </section>
      </div>

      <WeeklyChart />

      <footer
        style={{
          marginTop: '30px',
          textAlign: 'center',
          color: '#64748b',
        }}
      >
        Smart Study Lamp Dashboard | ESP32 + React + Node.js + MongoDB
      </footer>
    </div>
  );
}

const cardStyle = {
  background: '#ffffff',
  padding: '24px',
  borderRadius: '16px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
  textAlign: 'center',
};

const buttonStyle = {
  background: '#4f46e5',
  color: '#ffffff',
  padding: '12px 18px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};

const inputStyle = {
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
};

export default App;




// mongodb+srv://singhalsakshi176_db_user:As6XK199eZW8aiun@cluster0.izlkuqx.mongodb.net/