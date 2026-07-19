import React, { useState, useEffect, useRef, useContext } from 'react';
import { Send, Phone } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

// Live trip chat: messages are stored in trip_messages and delivered to the other
// participant over Supabase Realtime, so driver and passenger talk across devices.
export default function ChatSim({ rideId, partnerName = "Driver" }) {
  const { currentUser } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef(null);

  // Load history and subscribe to new messages for this ride
  useEffect(() => {
    if (!supabase || !rideId) return;
    let cancelled = false;

    supabase
      .from('trip_messages')
      .select('*')
      .eq('ride_id', rideId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('[Supabase] chat load failed:', error.message);
        if (!cancelled && data) setMessages(data);
      });

    const channel = supabase
      .channel(`trip-chat-${rideId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'trip_messages',
        filter: `ride_id=eq.${rideId}`,
      }, (payload) => {
        setMessages(prev => (prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !currentUser) return;
    if (text.length > 500) {
      alert('Messages are limited to 500 characters.');
      return;
    }

    const msg = {
      id: (crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`),
      ride_id: rideId,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      text,
      created_at: new Date().toISOString(),
    };

    // Optimistic append; the realtime echo is deduped by id.
    setMessages(prev => [...prev, msg]);
    setInputText("");

    if (supabase) {
      supabase.from('trip_messages').insert(msg).then(({ error }) => {
        if (error) console.error('[Supabase] chat send failed:', error.message);
      });
    }
  };

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCall = () => {
    alert(`Initiating voice call with ${partnerName}...\nCalling... 📞\n(Voice calling is simulated in this build)`);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '350px', padding: '16px' }}>
      {/* Chat header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            💬
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', margin: 0 }}>{partnerName}</h4>
            <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span> Live trip chat
            </span>
          </div>
        </div>

        <button onClick={handleCall} className="btn btn-secondary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
          <Phone size={14} /> Call
        </button>
      </div>

      {/* Message window */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px', marginBottom: '12px' }}>
        {messages.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '24px 8px' }}>
            No messages yet. Say hello to {partnerName}!
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser?.id;
          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMine ? 'flex-end' : 'flex-start',
              width: '100%'
            }}>
              <div style={{
                maxWidth: '80%',
                padding: '8px 12px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                backgroundColor: isMine ? 'var(--primary)' : 'var(--surface-hover)',
                color: isMine ? '#ffffff' : 'var(--text-main)',
                borderTopRightRadius: isMine ? '0' : '12px',
                borderTopLeftRadius: isMine ? '12px' : '0',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {msg.text}
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>
                {msg.sender_name?.split(' ')[0]} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          maxLength={500}
          className="input-field"
          style={{ margin: 0, padding: '8px 12px', fontSize: '0.85rem' }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
