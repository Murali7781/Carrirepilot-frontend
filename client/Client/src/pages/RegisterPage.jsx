import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const initialForm = {
  name: '',
  email: '',
  password: '',
  mobile: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(form);
      await login({ email: form.email, password: form.password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-badge">CareerPilot</div>
        <h2>Create your account</h2>
        <p>Start building your career profile and job roadmap.</p>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="on">
          <div className="mb-3">
            <label className="form-label" htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              type="text"
              className="form-control"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              className="form-control"
              name="email"
              autoComplete="username"
              inputMode="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="register-mobile">Mobile</label>
            <input
              id="register-mobile"
              type="tel"
              className="form-control"
              name="mobile"
              autoComplete="tel"
              value={form.mobile}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              className="form-control"
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer text-center">
          Already a member? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
