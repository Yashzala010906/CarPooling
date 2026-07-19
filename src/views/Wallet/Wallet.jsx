import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { CreditCard, ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, Lock } from 'lucide-react';
import { validateAmount } from '../../lib/validation';

export default function Wallet() {
  const { walletBalance, transactions, addFunds } = useContext(AppContext);
  const [rechargeAmt, setRechargeAmt] = useState('');
  const [rechargeError, setRechargeError] = useState('');

  const handleRecharge = (e) => {
    e.preventDefault();
    setRechargeError('');

    const invalid = validateAmount(rechargeAmt, { min: 1, max: 100000 });
    if (invalid) {
      setRechargeError(invalid);
      return;
    }

    addFunds(rechargeAmt);
    setRechargeAmt('');
    alert(`Successfully loaded ₹${parseFloat(rechargeAmt).toFixed(2)} into your Wallet!`);
  };

  const handleQuickAdd = (amt) => {
    setRechargeError('');
    addFunds(amt);
    alert(`Successfully loaded ₹${amt.toFixed(2)} into your Wallet!`);
  };

  return (
    <div className="view-container animate-fade">
      {/* View Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Wallet & Payments</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Recharge and review corporate travel expenses</p>
      </div>

      <div className="grid-2">
        {/* Left Side: Balance & Recharge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Balance card */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, hsl(262, 50%, 60%) 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ zIndex: 1 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>
                AVAILABLE BALANCE
              </span>
              <h1 style={{ color: '#ffffff', fontSize: '2.5rem', fontWeight: '800', margin: '4px 0' }}>
                ₹{walletBalance.toFixed(2)}
              </h1>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Active Sandbox Account</span>
            </div>
            <WalletIcon size={80} style={{ opacity: 0.1, position: 'absolute', right: '10px', bottom: '-10px' }} />
          </div>

          {/* Recharge form */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Recharge Wallet</h3>
            
            {/* Quick add buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[100, 200, 500, 1000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAdd(amt)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            <form onSubmit={handleRecharge}>
              {rechargeError && (
                <div className="badge badge-danger" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', textAlign: 'left' }}>
                  {rechargeError}
                </div>
              )}
              <div className="input-group">
                <label className="input-label">Custom Recharge Amount (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-light)', fontWeight: 'bold' }}>₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={rechargeAmt}
                    onChange={(e) => setRechargeAmt(e.target.value)}
                    placeholder="Enter amount (e.g. 500)"
                    className="input-field"
                    style={{ paddingLeft: '32px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <Lock size={12} />
                <span>Simulated secure test sandbox mode</span>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Recharge via Sandbox Gateway
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Transactions History */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '430px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Transaction Logs</h3>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
            {transactions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px' }}>
                No recent transactions.
              </p>
            ) : (
              transactions.map(tx => {
                const isRecharge = tx.type !== 'payment';
                return (
                  <div key={tx.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#fafafa'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isRecharge ? 'var(--success-light)' : 'var(--danger-light)',
                        color: isRecharge ? 'var(--success)' : 'var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isRecharge ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <h5 style={{ fontSize: '0.85rem', margin: 0, fontWeight: '600' }}>{tx.desc}</h5>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                          {new Date(tx.date).toLocaleDateString()} at {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <span style={{
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      color: isRecharge ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {isRecharge ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
