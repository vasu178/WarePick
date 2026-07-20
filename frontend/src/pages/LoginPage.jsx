import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * LoginPage — Full-screen dark login page with Forge Command design.
 */
export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        // Try sign up if sign in fails
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setError(signUpError.message);
        } else {
          onLogin(signUpData.user);
        }
      } else {
        onLogin(data.user);
      }
    } catch (err) {
      setError('Connection failed. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-pattern opacity-30" />

      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-stack-sm text-primary mb-4">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              widgets
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface">WarePick</h1>
          <p className="font-data-mono text-data-mono text-on-surface-variant mt-2">
            Warehouse Command Center
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface-container border border-outline-variant rounded-lg p-container-padding space-y-stack-md shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-2 mb-stack-sm border-b border-outline-variant pb-2">
            <span className="material-symbols-outlined text-primary">login</span>
            <h2 className="font-title-sm text-title-sm text-on-surface">Operator Login</h2>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/30 rounded p-2 text-error font-data-mono text-data-mono">
              {error}
            </div>
          )}

          <div>
            <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 uppercase">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0F0F10] border border-outline-variant rounded p-2 text-data-mono font-data-mono text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50"
              placeholder="operator@warepick.io"
              required
            />
          </div>

          <div>
            <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0F0F10] border border-outline-variant rounded p-2 text-data-mono font-data-mono text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container text-on-primary-container font-label-caps text-label-caps py-2.5 px-4 rounded hover:bg-primary-fixed transition-colors flex items-center justify-center gap-2 font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">lock_open</span>
            {loading ? 'Authenticating...' : 'Access System'}
          </button>
          
          <button
            type="button"
            onClick={() => onLogin({ email: 'offline@warepick.io', id: 'offline-mode' })}
            className="w-full bg-surface-variant text-on-surface-variant font-label-caps text-label-caps py-2.5 px-4 rounded hover:text-on-surface transition-colors flex items-center justify-center gap-2 font-bold uppercase tracking-wider mt-2"
          >
            <span className="material-symbols-outlined text-lg">wifi_off</span>
            Bypass Login (Offline Mode)
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-6 font-data-mono text-[11px] text-on-surface-variant/50">
          WarePick Simulator v2.4 · Secure Access Required
        </p>
      </div>
    </div>
  );
}
