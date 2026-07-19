import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { ArrowRight, Lock, Mail, User, Shield, Compass, Sparkles } from 'lucide-react';
import { validateEmail, validatePassword, validateName } from '../../lib/validation';

export default function Auth() {
  const { login, signup } = useContext(AppContext);
  const [authStep, setAuthStep] = useState('splash'); // 'splash', 'login', 'signup', 'profile'

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Signup Form States
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupOrg, setSignupOrg] = useState('Acme Corp');
  const [signupError, setSignupError] = useState('');

  // Shared submit-in-progress flag
  const [busy, setBusy] = useState(false);

  // Splash Screen timeout
  useEffect(() => {
    if (authStep === 'splash') {
      const timer = setTimeout(() => {
        setAuthStep('login');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [authStep]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const invalid = validateEmail(loginEmail) || validatePassword(loginPassword);
    if (invalid) {
      setLoginError(invalid);
      return;
    }

    setBusy(true);
    const res = await login(loginEmail, loginPassword);
    setBusy(false);
    if (!res.success) {
      setLoginError(res.message);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError('');

    const invalid =
      validateName(signupName) ||
      validateEmail(signupEmail) ||
      validatePassword(signupPassword) ||
      (!signupOrg ? 'Please select your corporate group.' : null);
    if (invalid) {
      setSignupError(invalid);
      return;
    }

    setBusy(true);
    const res = await signup(signupName, signupEmail, signupPassword, signupOrg);
    setBusy(false);
    if (!res.success) {
      setSignupError(res.message);
    }
  };

  if (authStep === 'splash') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, var(--primary-light) 0%, #ffffff 100%)',
        textAlign: 'center',
        padding: '24px'
      }}>
        <div className="pulse-soft" style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifycontent: 'center',
          fontWeight: '800',
          fontSize: '2.5rem',
          boxShadow: 'var(--shadow-primary)',
          marginBottom: '20px'
        }}>
          🚗
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
          odoo Carpool
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '400px', marginBottom: '24px' }}>
          Seamless Enterprise Ride Sharing between Trusted Coworkers.
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--primary)', fontWeight: '600' }}>
          <span>Loading Platform Context</span>
          <span style={{ display: 'inline-flex', gap: '2px' }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', animation: 'pulseSoft 0.8s infinite' }}></span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', animation: 'pulseSoft 0.8s infinite 0.2s' }}></span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', animation: 'pulseSoft 0.8s infinite 0.4s' }}></span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: '#f8fafc',
      padding: '24px'
    }}>
      <div className="card animate-fade" style={{ maxWidth: '440px', width: '100%', padding: '40px' }}>
        
        {/* Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '1.5rem',
            marginBottom: '12px'
          }}>
            🚗
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>
            Welcome to Carpool
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Log in to discover or publish active organization rides
          </p>
        </div>

        {authStep === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            {loginError && (
              <div className="badge badge-danger" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', textAlign: 'left' }}>
                {loginError}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Corporate Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn btn-primary" style={{ width: '100%', padding: '12px', opacity: busy ? 0.7 : 1 }}>
              {busy ? 'Signing In…' : <>Log In <ArrowRight size={16} /></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Don't have an account?{' '}
                <button type="button" onClick={() => setAuthStep('signup')} style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>
                  Register
                </button>
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit}>
            {signupError && (
              <div className="badge badge-danger" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', textAlign: 'left' }}>
                {signupError}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="John Doe"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Corporate Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="john.doe@company.com"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label className="input-label">Registered Corporate Group</label>
              <div style={{ position: 'relative' }}>
                <Shield size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                <select
                  value={signupOrg}
                  onChange={(e) => setSignupOrg(e.target.value)}
                  className="input-field select-field"
                  style={{ paddingLeft: '40px' }}
                >
                  <option value="Acme Corp">Acme Corp (Silicon Blvd)</option>
                  <option value="Global Logistics">Global Logistics Group</option>
                  <option value="Odoo Partner Ltd">Odoo Partner Ltd</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn btn-primary" style={{ width: '100%', padding: '12px', opacity: busy ? 0.7 : 1 }}>
              {busy ? 'Creating Account…' : <>Create Account <Sparkles size={16} /></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Already registered?{' '}
                <button type="button" onClick={() => setAuthStep('login')} style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>
                  Log In
                </button>
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
