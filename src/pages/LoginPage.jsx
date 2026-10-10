import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowUpRight, FiCheck, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';
import '../styles/auth.scss';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || authLoading) return;
    setLoading(true); setError('');
    try {
      const user = await login(form);
      const role = String(user?.role || '').toLowerCase();
      navigate(['candidate', 'admin'].includes(role) ? '/dashboard' : '/profile', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to sign in right now. Please try again.'));
    } finally { setLoading(false); }
  };

  return <main className="auth-shell auth-modern">
    <aside className="auth-story-panel">
      <div className="auth-art-heading"><span className="auth-overline">YOUR NEXT MOVE, MADE CLEAR</span><h1>Make your next career move with confidence.</h1><p>Keep your goals, applications, and interview practice together in one focused workspace.</p></div>
      <div className="auth-art-wrap"><img src="https://images.unsplash.com/photo-1758518730327-98070967caab?auto=format&fit=crop&w=800&q=70&fm=webp" alt="A career conversation as a professional reviews a resume" loading="eager" fetchPriority="high" decoding="async" /><div className="auth-art-caption"><span className="auth-art-check"><FiCheck /></span><span><strong>Your experience, clearly presented</strong><small>Build a stronger next step with CareerPilot</small></span></div></div>
    </aside>
    <section className="auth-form-panel">
      <div className="auth-mobile-brand"><span className="auth-brand-mark">C</span> CareerPilot</div>
      <div className="auth-form-content">
        <div className="auth-form-eyebrow"><FiLock /> SECURE SIGN IN</div>
        <h2>Welcome back</h2><p className="auth-intro">Sign in to pick up where your career journey left off.</p>
        {error ? <div className="auth-error" role="alert">{error}</div> : null}
        <form onSubmit={handleSubmit} className="auth-form auth-modern-form" autoComplete="on">
          <label htmlFor="login-email">Email address</label>
          <input id="login-email" type="email" name="email" autoComplete="username" inputMode="email" maxLength={255} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          <div className="auth-password-label"><label htmlFor="login-password">Password</label></div>
          <div className="auth-password-wrap"><input id="login-password" type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></div>
          <button type="submit" className="auth-submit" disabled={loading || authLoading}>{authLoading ? 'Checking session…' : loading ? 'Signing in…' : 'Sign in'}<FiArrowUpRight /></button>
        </form>
        <p className="auth-switch">New to CareerPilot? <Link to="/register">Create your account</Link></p>
      </div>
      <footer className="auth-form-footer">CareerPilot <span>·</span> Career planning, made practical</footer>
    </section>
  </main>;
}
