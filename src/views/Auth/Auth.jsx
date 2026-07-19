import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { ArrowRight, Lock, Mail, User, Sparkles, UserCheck, ShieldAlert, Check, X } from 'lucide-react';
import { validateEmail, validatePassword, validateName } from '../../lib/validation';

export default function Auth() {
  const { login, signup } = useContext(AppContext);
  const [authStep, setAuthStep] = useState('login'); // 'login' or 'signup'
  const [selectedRole, setSelectedRole] = useState('employee'); // 'employee' or 'admin'
  const [signupRole, setSignupRole] = useState('employee'); // 'employee' or 'admin' for registration

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Signup Form States
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');

  const [busy, setBusy] = useState(false);

  const getPasswordRules = (pass) => {
    const p = pass || '';
    return [
      { label: 'At least 8 characters', valid: p.length >= 8 },
      { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(p) },
      { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(p) },
      { label: 'One number (0-9)', valid: /[0-9]/.test(p) },
      { label: 'One special character (!@#$%^&*)', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
    ];
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setLoginError('');
  };

  // Submit Login Form
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

  // Submit Signup Form
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
    const roleName = signupRole === 'admin' ? 'Administrator' : 'Employee';
    const res = await signup(signupName, signupEmail, signupPassword, roleName);
    setBusy(false);
    if (!res.success) {
      setSignupError(res.message);
    }
  };

  const activePasswordRules = getPasswordRules(authStep === 'signup' ? signupPassword : loginPassword);

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
      <div className="card animate-fade" style={{ maxWidth: '450px', width: '100%', padding: '36px' }}>
        
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
            {authStep === 'signup' 
              ? (signupRole === 'admin' ? 'Register Admin Account' : 'Register Employee Account')
              : (selectedRole === 'admin' ? 'Company Administration Portal' : 'Welcome to Carpool')
            }
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {authStep === 'signup'
              ? 'Create a new verified enterprise carpool account'
              : (selectedRole === 'admin' ? 'Access organization overview, manage employees and rides' : 'Log in to discover or publish active organization rides')
            }
          </p>
        </div>

        {/* Role Selection Tabs for LOGIN */}
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

        {/* Role Selection Tabs for SIGNUP */}
        {authStep === 'signup' && (
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
              onClick={() => setSignupRole('employee')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: signupRole === 'employee' ? '#ffffff' : 'transparent',
                color: signupRole === 'employee' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: signupRole === 'employee' ? '700' : '500',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: signupRole === 'employee' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <UserCheck size={16} /> Register as Employee
            </button>

            <button
              type="button"
              onClick={() => setSignupRole('admin')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: signupRole === 'admin' ? '#ffffff' : 'transparent',
                color: signupRole === 'admin' ? 'var(--danger)' : 'var(--text-muted)',
                fontWeight: signupRole === 'admin' ? '700' : '500',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: signupRole === 'admin' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <ShieldAlert size={16} /> Register as Admin
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
                {selectedRole === 'admin' ? 'Admin Email Address' : 'Employee Email Address'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={selectedRole === 'admin' ? 'admin@gmail.com' : 'employee@gmail.com'}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '16px' }}>
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

            {/* Real-time Password Rules Guidance */}
            {loginPassword && (
              <div style={{
                backgroundColor: '#fafafa',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '20px',
                fontSize: '0.75rem'
              }}>
                <span style={{ fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Password Requirements:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {activePasswordRules.map((rule, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: rule.valid ? '#16a34a' : 'var(--text-muted)' }}>
                      {rule.valid ? <Check size={12} /> : <X size={12} style={{ opacity: 0.5 }} />}
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className={`btn ${selectedRole === 'admin' ? 'btn-danger' : 'btn-primary'}`}
              style={{ width: '100%', padding: '12px', opacity: busy ? 0.7 : 1 }}
            >
              {busy ? 'Logging In…' : <>{selectedRole === 'admin' ? 'Log In as Admin' : 'Log In as Employee'} <ArrowRight size={16} /></>}
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
              <label className="input-label">Email Address (Gmail / Corporate Domain)</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            {/* Real-time Password Rules Guidance */}
            {signupPassword && (
              <div style={{
                backgroundColor: '#fafafa',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '20px',
                fontSize: '0.75rem'
              }}>
                <span style={{ fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Password Requirements:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {activePasswordRules.map((rule, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: rule.valid ? '#16a34a' : 'var(--text-muted)' }}>
                      {rule.valid ? <Check size={12} /> : <X size={12} style={{ opacity: 0.5 }} />}
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary" style={{ width: '100%', padding: '12px', opacity: busy ? 0.7 : 1 }}>
              {busy ? 'Creating Account…' : <>Create {signupRole === 'admin' ? 'Admin' : 'Employee'} Account <Sparkles size={16} /></>}
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
