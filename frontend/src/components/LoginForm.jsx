import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Warehouse } from 'lucide-react';

/**
 * LoginForm — Supabase Auth login/signup.
 * Supports demo mode bypass for quick testing.
 */
export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  // Check existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) onLogin(session.user);
    });
  }, [onLogin]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isSignup) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) throw result.error;
      if (result.data.user) onLogin(result.data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    onLogin({ id: 'demo', email: 'demo@warepick.local', role: 'admin' });
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div style={{ textAlign: 'center' }}>
          <div className="header__logo-icon" style={{ margin: '0 auto 12px', width: 48, height: 48, fontSize: 22, borderRadius: 10 }}>
            <Warehouse size={24} />
          </div>
          <div className="login-card__title">WarePick</div>
          <div className="login-card__subtitle">Smart Warehouse Command Center</div>
        </div>

        {error && <div className="login-card__error">{error}</div>}

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="admin@warepick.local" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
            {loading ? '...' : isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="flex justify-between items-center">
          <button className="btn btn--sm" onClick={() => setIsSignup(!isSignup)} style={{ fontSize: 11 }}>
            {isSignup ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
          <button className="btn btn--full" onClick={handleDemoMode} style={{ background: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.3)', color: '#22d3ee' }}>
            🎮 Enter Demo Mode (no login)
          </button>
        </div>
      </div>
    </div>
  );
}
