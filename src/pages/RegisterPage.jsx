import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowUpRight, FiCheck, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';
import '../styles/auth.scss';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || authLoading) return;
    const mobileDigits = form.mobile.replace(/\D/g, '').length;
    if (form.mobile && (mobileDigits < 7 || mobileDigits > 15)) {
      setError('Enter a valid mobile number with 7 to 15 digits.');
      return;
    }
    if (new TextEncoder().encode(form.password).length > 72) {
      setError('Password must be 72 bytes or fewer.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setLoading(true); setError('');
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to create your account. Please try again.'));
    } finally { setLoading(false); }
  };

  return <main className="auth-shell auth-modern auth-register">
    <aside className="auth-story-panel">
      <div className="auth-art-heading"><span className="auth-overline">START WITH A CLEAR PLAN</span><h1>Your next opportunity starts here.</h1><p>Create a private workspace to organize the work behind your next career step.</p></div>
      <div className="auth-art-wrap"><img src="https://images.unsplash.com/photo-1758518730327-98070967caab?auto=format&fit=crop&w=800&q=70&fm=webp" alt="A career conversation as a professional reviews a resume" loading="eager" fetchPriority="high" decoding="async" /><div className="auth-art-caption"><span className="auth-art-check"><FiCheck /></span><span><strong>Start with your story</strong><small>Keep your goals and applications together</small></span></div></div>
    </aside>
    <section className="auth-form-panel">
      <div className="auth-mobile-brand"><span className="auth-brand-mark">C</span> CareerPilot</div>
      <div className="auth-form-content">
        <div className="auth-form-eyebrow"><FiLock /> PRIVATE CAREER WORKSPACE</div>
        <h2>Create your account</h2><p className="auth-intro">Start with the basics. You can add career details later.</p>
        {error ? <div className="auth-error" role="alert">{error}</div> : null}
        <form onSubmit={handleSubmit} className="auth-form auth-modern-form" autoComplete="on">
          <label htmlFor="register-name">Full name</label><input id="register-name" type="text" name="name" autoComplete="name" maxLength={100} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          <label htmlFor="register-email">Email address</label><input id="register-email" type="email" name="email" autoComplete="email" inputMode="email" maxLength={255} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          <label htmlFor="register-mobile">Mobile number <span className="auth-optional">Optional</span></label><input id="register-mobile" type="tel" name="mobile" autoComplete="tel" inputMode="tel" pattern="[+]?(?:[0-9]|[(][0-9]{1,4}[)])[0-9 ().-]*[0-9]" title="Use 7 to 15 digits; spaces, parentheses, dots, dashes, and a leading plus are allowed." maxLength={20} value={form.mobile} onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))} />
          <label htmlFor="register-password">Password</label>
          <div className="auth-password-wrap"><input id="register-password" type={showPassword ? 'text' : 'password'} name="password" autoComplete="new-password" minLength={12} maxLength={72} value={form.password} onChange={(event) => { const password = event.target.value; setForm((current) => ({ ...current, password })); setPasswordError(form.confirmPassword && password !== form.confirmPassword ? 'Passwords do not match.' : ''); }} required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></div>
          <small className="auth-password-hint">Use at least 12 characters. A memorable passphrase works well.</small>
          <label htmlFor="register-confirm-password">Confirm password</label>
          <div className="auth-password-wrap"><input id="register-confirm-password" type={showPassword ? 'text' : 'password'} name="confirmPassword" autoComplete="new-password" minLength={12} maxLength={72} value={form.confirmPassword || ''} aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? 'register-password-error' : undefined} onChange={(event) => { const confirmPassword = event.target.value; setForm((current) => ({ ...current, confirmPassword })); setPasswordError(confirmPassword && confirmPassword !== form.password ? 'Passwords do not match.' : ''); }} required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></div>
          {passwordError ? <small id="register-password-error" className="auth-password-hint" role="alert">{passwordError}</small> : null}
          <button type="submit" className="auth-submit" disabled={loading || authLoading}>{authLoading ? 'Checking session…' : loading ? 'Creating account…' : 'Create account'}<FiArrowUpRight /></button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
      <footer className="auth-form-footer">CareerPilot <span>·</span> Career planning, made practical</footer>
    </section>
  </main>;
}
