import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function getClientId() {
  let id = localStorage.getItem('ppt_client_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('ppt_client_id', id);
  }
  return id;
}

async function detectVPN() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
    const ip = response.data.ip;
    const localIPs = ['127.0.0.1', 'localhost', '::1'];
    if (localIPs.includes(ip)) return false;
    
    const vpnResponse = await axios.get(`https://vpnapi.io/api/${ip}?key=free`, { timeout: 5000 });
    const data = vpnResponse.data;
    return data?.security?.vpn || data?.security?.proxy || data?.security?.tor || false;
  } catch (e) {
    return false;
  }
}

const API_URL = "https://alerts-principal-recipient-childhood.trycloudflare.com";

function App() {
  const [topic, setTopic] = useState('');
  const [numSlides, setNumSlides] = useState(5);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ free_used: false, is_subscribed: false });
  const [activateKey, setActivateKey] = useState('');
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [vpnDetected, setVpnDetected] = useState(false);
  const [checkingVPN, setCheckingVPN] = useState(true);
  
  const canvasRef = useRef(null);
  const clientId = getClientId();

  useEffect(() => {
    checkVPN();
  }, []);

  useEffect(() => {
    if (!vpnDetected) fetchStatus();
  }, [vpnDetected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1
      });
    }
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = vpnDetected 
          ? `rgba(255, 59, 92, ${p.opacity})` 
          : `rgba(0, 210, 255, ${p.opacity})`;
        ctx.fill();
      });
      requestAnimationFrame(animate);
    }
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [vpnDetected]);

  const checkVPN = async () => {
    setCheckingVPN(true);
    const result = await detectVPN();
    setVpnDetected(result);
    setCheckingVPN(false);
  };

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/me?client_id=${clientId}`);
      setUser(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    setError('');
    setStatusMessage('');
    setGenerated(false);
    if (!topic.trim()) return;
    setLoading(true);
    setStatusMessage('Connecting to neural engine...');
    
    try {
      setTimeout(() => setStatusMessage('Analyzing topic...'), 800);
      setTimeout(() => setStatusMessage('Selecting perfect template...'), 1600);
      setTimeout(() => setStatusMessage('Generating slides...'), 2400);
      
      const response = await axios.post(
        `${API_URL}/api/generate?client_id=${clientId}`,
        { topic, num_slides: numSlides },
        { responseType: 'blob' }
      );

      setStatusMessage('Finalizing presentation...');
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Presentation.pptx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setGenerated(true);
      setStatusMessage('Presentation ready! Check your downloads.');
      await fetchStatus();
    } catch (err) {
      if (err.response?.status === 402) {
        setError('Free trial exhausted. Activate PRO to continue.');
      } else if (err.response?.status === 500) {
        setError('Neural engine offline. Start LM Studio.');
      } else {
        setError('Transmission error. Retry.');
      }
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      await axios.post(`${API_URL}/api/subscribe?client_id=${clientId}`, { key: activateKey });
      setActivateKey('');
      await fetchStatus();
      setError('');
    } catch (e) {
      setError('Invalid activation key');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleGenerate();
    }
  };

  if (checkingVPN) {
    return (
      <div className="app-container">
        <canvas ref={canvasRef} className="particle-canvas"></canvas>
        <div className="glass-container">
          <div className="logo-section">
            <div className="logo-icon">
              <span className="logo-text">S</span>
              <div className="logo-pulse"></div>
            </div>
            <h1 className="main-title">
              <span className="gradient-text">Slide</span>
              <span className="white-text">AI</span>
            </h1>
          </div>
          <div className="status-message">
            <span className="status-spinner"></span>
            Checking connection security...
          </div>
        </div>
      </div>
    );
  }

  if (vpnDetected) {
    return (
      <div className="app-container">
        <canvas ref={canvasRef} className="particle-canvas"></canvas>
        <div className="glass-container">
          <div className="logo-section">
            <div className="logo-icon vpn-warning">
              <span className="logo-text">!</span>
              <div className="logo-pulse warning-pulse"></div>
            </div>
          </div>
          
          <div className="vpn-warning-section">
            <div className="warning-icon-large">&#9888;</div>
            <h2 className="warning-title">VPN or Proxy Detected</h2>
            <p className="warning-desc">
              For security reasons, SlideAI cannot be accessed through VPN or proxy connections. 
              Please disable your VPN and reload the page to continue.
            </p>
            
            <div className="warning-steps">
              <div className="step">
                <span className="step-number">1</span>
                <span>Disconnect your VPN or Proxy</span>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <span>Reload this page</span>
              </div>
            </div>
            
            <button className="reload-btn" onClick={() => window.location.reload()}>
              <span className="btn-content">
                <span className="btn-icon">&#8635;</span>
                I've Disabled VPN - Reload
              </span>
              <div className="btn-glow"></div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <canvas ref={canvasRef} className="particle-canvas"></canvas>
      
      <div className="glass-container">
        <div className="logo-section">
          <div className="logo-icon">
            <span className="logo-text">S</span>
            <div className="logo-pulse"></div>
          </div>
          <h1 className="main-title">
            <span className="gradient-text">Slide</span>
            <span className="white-text">AI</span>
            <span className="version-badge">PRO</span>
          </h1>
          <p className="subtitle">Neural Presentation Engine</p>
        </div>

        <div className={`status-chip ${user.is_subscribed ? 'pro' : user.free_used ? 'used' : 'free'}`}>
          <span className="status-dot"></span>
          {user.is_subscribed ? 'PRO ACTIVE' : user.free_used ? 'LIMIT REACHED' : '1 FREE GENERATION'}
        </div>

        <div className="generator-section">
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">&#9670;</span>
              <input
                type="text"
                placeholder="Enter your presentation topic..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={handleKeyDown}
                className="topic-input"
              />
              <div className="input-glow"></div>
            </div>
            
            <div className="controls-row">
              <div className="slide-selector">
                <label className="selector-label">Slides</label>
                <div className="selector-buttons">
                  {[3, 5, 7, 10].map(n => (
                    <button
                      key={n}
                      className={`num-btn ${numSlides === n ? 'active' : ''}`}
                      onClick={() => setNumSlides(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                className="generate-btn"
                onClick={handleGenerate}
                disabled={loading || (!user.is_subscribed && user.free_used)}
              >
                <span className="btn-content">
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">&#10022;</span>
                      Generate
                    </>
                  )}
                </span>
                <div className="btn-glow"></div>
              </button>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="status-message">
            <span className="status-spinner"></span>
            {statusMessage}
          </div>
        )}

        {generated && !loading && (
          <div className="success-message">
            <span className="success-icon">&#10003;</span>
            Presentation generated successfully!
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">&#9888;</span>
            {error}
          </div>
        )}

        {!user.is_subscribed && user.free_used && (
          <div className="pro-section">
            <div className="pro-card">
              <div className="pro-header">
                <span className="pro-star">&#9733;</span>
                <h3>UNLOCK PRO</h3>
              </div>
              <p className="pro-desc">Unlimited generations, all templates, priority support</p>
              <div className="activate-row">
                <input
                  type="text"
                  placeholder="Activation key"
                  value={activateKey}
                  onChange={(e) => setActivateKey(e.target.value)}
                  className="key-input"
                />
                <button onClick={handleActivate} className="activate-btn">
                  Activate
                </button>
              </div>
              <span className="hint-text">Test key: super-secret-key-123</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;