import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { saveProfile, user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', targetRole: '', location: '', workMode: 'Any' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        const profile = response.data.data.user;
        setForm({
          name: profile.name || '',
          email: profile.email || '',
          mobile: profile.mobile || '',
          targetRole: profile.targetRole || '',
          location: profile.location || '',
          workMode: profile.workMode || 'Any',
        });
      } catch (err) {
        setError('Unable to load profile information.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await saveProfile(form);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading profile...</div>;
  }

  return (
    <div className="page-section">
      <div className="panel-card narrow-panel">
        <div className="panel-header"><div><div className="eyebrow">Your career compass</div><h3>Career profile</h3><p className="text-muted mb-0">Keep your details and job preferences ready for every application.</p></div></div>

        {error ? <div className="alert alert-danger">{error}</div> : null}
        {success ? <div className="alert alert-success">{success}</div> : null}

        <form onSubmit={handleSubmit} className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Full name</label>
            <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>

          <div className="col-md-12">
            <label className="form-label">Mobile</label>
            <input className="form-control" name="mobile" value={form.mobile} onChange={handleChange} required />
          </div>
          <div className="col-12"><hr /><h4 className="section-label">Job preferences</h4></div>
          <div className="col-md-6"><label className="form-label">Target role</label><input className="form-control" name="targetRole" placeholder="e.g. Product designer" value={form.targetRole} onChange={handleChange} /></div>
          <div className="col-md-6"><label className="form-label">Preferred location</label><input className="form-control" name="location" placeholder="e.g. Remote or New York" value={form.location} onChange={handleChange} /></div>
          <div className="col-md-6"><label className="form-label">Work mode</label><select className="form-select" name="workMode" value={form.workMode} onChange={handleChange}><option>Any</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></div>

          <div className="col-md-12 d-flex justify-content-end mt-3">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
