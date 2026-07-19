import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { ArrowRight, Lock, Mail, User, Shield, Sparkles, UserCheck, ShieldAlert } from 'lucide-react';
import { validateEmail, validatePassword, validateName } from '../../lib/validation';

export default function Auth() {
  const { login, signup } = useContext(AppContext);
  const [authStep, setAuthStep] = useState('splash'); // 'splash', 'login', 'signup'
  const [selectedRole, setSelectedRole] = useState('employee'); // 'employee' or 'admin'

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('david.c@acme.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');

  // Signup Form States
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');

  // Shared submit-in-progress flag
  const [busy, setBusy] = useState(false);

  // Splash Screen timeout
  useEffect(() => {
    if (authStep === 'splash') {
      const timer = setTimeout(() => {
        setAuthStep('login');
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [authStep]);

  // Update default email depending on selected role tab
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setLoginError('');
    if (role === 'admin') {
      setLoginEmail('marcus.v@acme.com');
    } else {
      setLoginEmail('david.c@acme.com');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const invalid = validateEmail(loginEmail) || validatePassword(loginPassword);
    if (invalid) {
      setLoginError(invalid);
      return;
    }

    setBusy(true);
    const res = await login(loginEmail, loginPassword, selectedRole);
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
      validatePassword(signupPassword);
    if (invalid) {
      setSignupError(invalid);
      return;
    }

    setBusy(true);
    const res = await signup(signupName, signupEmail, signupPassword);
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
          justifyContent: 'center',
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
      <div className="card animate-fade" style={{ maxWidth: '460px', width: '100%', padding: '36px' }}>
        
        {/* Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: selectedRole === 'admin' ? '#fef2f2' : 'var(--primary-light)',
            color: selectedRole === 'admin' ? 'var(--danger)' : 'var(--primary)',
            fontSize: '1.5rem',
            marginBottom: '12px'
          }}>
            {selectedRole === 'admin' ? '🛡️' : '🚗'}
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {selectedRole === 'admin' ? 'Company Administration Portal' : 'Welcome to Carpool'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {selectedRole === 'admin' 
              ? 'Access organization overview, manage employees and rides' 
              : 'Log in to discover or publish active organization rides'}
          </p>
        </div>

        {/* 2-Role Login Selection Tabs */}
        {authStep === 'login' && (
          <div style={{
            display: 'flex',
            borderRadius: '10px',
            backgroundColor: '#f1f5f9',
            padding: '4px',
            marginBottom: '24px',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => handleRoleChange('employee')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: selectedRole === 'employee' ? '#ffffff' : 'transparent',
                color: selectedRole === 'employee' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: selectedRole === 'employee' ? '700' : '500',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: selectedRole === 'employee' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <UserCheck size={16} /> Employee Login
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: selectedRole === 'admin' ? '#ffffff' : 'transparent',
                color: selectedRole === 'admin' ? 'var(--danger)' : 'var(--text-muted)',
                fontWeight: selectedRole === 'admin' ? '700' : '500',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: selectedRole === 'admin' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <ShieldAlert size={16} /> Admin Login
            </button>
          </div>
        )}

        {authStep === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            {loginError && (
              <div className="badge badge-danger" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', textAlign: 'left' }}>
                {loginError}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">
                {selectedRole === 'admin' ? 'Admin Corporate Email' : 'Employee Email'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={selectedRole === 'admin' ? 'marcus.v@acme.com' : 'david.c@acme.com'}
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

            <button
              type="submit"
              disabled={busy}
              className={`btn ${selectedRole === 'admin' ? 'btn-danger' : 'btn-primary'}`}
              style={{ width: '100%', padding: '12px', opacity: busy ? 0.7 : 1 }}
            >
              {busy ? 'Signing In…' : <>{selectedRole === 'admin' ? 'Log In as Admin' : 'Log In as Employee'} <ArrowRight size={16} /></>}
            </button>

            {/* Quick Demo Role Logins */}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '20px', paddingTop: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
                1-Click Quick Demo Login
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => login('david.c@acme.com', 'password123', 'employee')}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <UserCheck size={14} style={{ color: 'var(--primary)' }} /> Employee
                </button>

                <button
                  type="button"
                  onClick={() => login('marcus.v@acme.com', 'password123', 'admin')}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <ShieldAlert size={14} style={{ color: 'var(--danger)' }} /> Admin
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
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

            <div className="input-group" style={{ marginBottom: '24px' }}>
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
