import { useEffect, useMemo, useState } from 'react';
import { FiArrowRight, FiBriefcase, FiCheck, FiEdit2, FiFileText, FiMapPin, FiTarget, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/dashboard.scss';
import '../styles/interviews.scss';

const blankProfile = { name: '', email: '', mobile: '', targetRole: '', location: '', workMode: 'Any' };
function parseSkills(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return value.split(',').map((item) => item.trim()).filter(Boolean); }
}
function initials(value = '') { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CP'; }

export default function ProfilePage() {
  const { saveProfile, user } = useAuth();
  const canViewCareerWorkspace = ['candidate', 'admin'].includes(String(user?.role || '').toLowerCase());
  const [form, setForm] = useState(blankProfile);
  const [resumes, setResumes] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/users/profile'),
      canViewCareerWorkspace ? api.get('/resumes') : Promise.resolve(null),
    ])
      .then(([profileResponse, resumeResponse]) => {
        if (!active) return;
        const profile = profileResponse.data?.data?.user || {};
        setForm({ name: profile.name || '', email: profile.email || '', mobile: profile.mobile || '', targetRole: profile.targetRole || '', location: profile.location || '', workMode: profile.workMode || 'Any' });
        setResumes(resumeResponse?.data?.data?.resumes || []);
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load your career profile.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canViewCareerWorkspace]);

  const topSkills = useMemo(() => [...new Map(resumes.flatMap((resume) => parseSkills(resume.skills)).filter((skill) => typeof skill === 'string' && skill.trim()).map((skill) => [skill.trim().toLowerCase(), skill.trim()])).values()].slice(0, 12), [resumes]);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setError(''); setSuccess('');
    const mobileDigits = form.mobile.replace(/\D/g, '').length;
    if (form.mobile && (mobileDigits < 7 || mobileDigits > 15)) {
      setError('Enter a valid mobile number with 7 to 15 digits.');
      return;
    }
    setSaving(true);
    try {
      const payload = canViewCareerWorkspace ? form : { name: form.name, email: form.email, mobile: form.mobile };
      const updated = await saveProfile(payload);
      setForm((current) => ({ ...current, ...updated }));
      setSuccess(canViewCareerWorkspace ? 'Your profile and job preferences are saved.' : 'Your account profile is saved.');
      setEditing(false);
    }
    catch (err) { setError(err.response?.data?.message || 'Unable to save your profile.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="page-loading" role="status">Loading career profile…</div>;
  return <div className="page-section profile-page">
    {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}{success ? <div className="alert alert-success" role="status">{success}</div> : null}
    <section className="profile-cover"><div className="profile-cover-pattern" aria-hidden="true" /><div className="profile-avatar">{initials(form.name)}</div><div className="profile-identity"><span className="eyebrow">{canViewCareerWorkspace ? 'CANDIDATE PROFILE' : 'ACCOUNT PROFILE'}</span><h2>{form.name || 'Your name'}</h2><p>{canViewCareerWorkspace ? form.targetRole || 'Add a target role to personalize your career workspace' : 'Manage your account contact details.'}</p><div className="profile-identity-meta">{canViewCareerWorkspace && form.location ? <span><FiMapPin /> {form.location}</span> : null}{canViewCareerWorkspace ? <span><FiBriefcase /> {form.workMode === 'Any' ? 'Open to work modes' : form.workMode}</span> : null}</div></div><button type="button" className="profile-edit-button" onClick={() => { setEditing((value) => !value); setError(''); setSuccess(''); }}><FiEdit2 /> {editing ? 'Cancel editing' : 'Edit profile'}</button></section>

    <div className={`profile-main-grid${canViewCareerWorkspace ? '' : ' profile-account-grid'}`}>
      <div className="profile-primary-column">
        <section className="profile-content-card"><div className="profile-card-heading"><div><span className="eyebrow">ABOUT</span><h3>{canViewCareerWorkspace ? 'Career overview' : 'Account details'}</h3></div><span className="profile-card-icon"><FiUser /></span></div><p className="profile-about-copy">{canViewCareerWorkspace ? (form.targetRole ? `Interested in ${form.targetRole}${form.location ? ` opportunities around ${form.location}` : ''}.` : 'Add a target role and preferred location so CareerPilot can connect your resume, role search, skill gaps, and interview practice to a clear goal.') : 'Manage your account contact details and your own job postings.'} {form.mobile ? `You can be reached at ${form.mobile}.` : ''}</p><div className="profile-info-grid"><div><small>EMAIL</small><strong>{form.email || 'Not provided'}</strong></div><div><small>PHONE</small><strong>{form.mobile || 'Not provided'}</strong></div>{canViewCareerWorkspace ? <><div><small>LOCATION</small><strong>{form.location || 'Add your preferred location'}</strong></div><div><small>WORK MODE</small><strong>{form.workMode}</strong></div></> : null}</div></section>
        {canViewCareerWorkspace ? <>
          <section className="profile-content-card profile-skills-card"><div className="profile-card-heading"><div><span className="eyebrow">TOP SKILLS</span><h3>Skills from your resume</h3></div><Link to="/resumes" className="profile-text-link">Manage resumes <FiFileText /></Link></div>{topSkills.length ? <div className="profile-skill-chips">{topSkills.map((skill) => <span key={skill}>{skill}</span>)}</div> : <div className="profile-empty-inline"><p>Your skill list comes from resumes you create in CareerPilot.</p><Link to="/resumes">Build your first resume <FiFileText /></Link></div>}</section>
          <section className="profile-content-card profile-preferences-card"><div className="profile-card-heading"><div><span className="eyebrow">CAREER DIRECTION</span><h3>Job preferences</h3></div><span className="profile-card-icon"><FiTarget /></span></div><p>These preferences help keep role discovery and practice relevant to your next step.</p><div className="profile-preference-summary"><div><span>Target role</span><strong>{form.targetRole || 'Not set'}</strong></div><div><span>Preferred area</span><strong>{form.location || 'Not set'}</strong></div><div><span>Work style</span><strong>{form.workMode}</strong></div></div></section>
        </> : null}
      </div>
      {canViewCareerWorkspace ? <aside className="profile-sidebar-column"><section className="profile-content-card profile-next-steps"><span className="eyebrow">YOUR WORKSPACE</span><h3>Keep your story consistent</h3><p>Use the same role goals as you refine your resume, shortlist opportunities, and practice for interviews.</p><Link to="/resumes"><span><FiFileText /> Resume builder</span><FiArrowRight /></Link><Link to="/jobs"><span><FiBriefcase /> Find matching roles</span><FiArrowRight /></Link><Link to="/interviews"><span><FiTarget /> Practice an interview</span><FiArrowRight /></Link></section><section className="profile-progress-card"><span className="eyebrow">PROFILE CHECKLIST</span><h3>{[form.name, form.email, form.targetRole, form.location].filter(Boolean).length}/4 details added</h3><div className="profile-checklist">{[['Your name', Boolean(form.name)], ['Contact email', Boolean(form.email)], ['Target role', Boolean(form.targetRole)], ['Preferred area', Boolean(form.location)]].map(([label, done]) => <div key={label} className={done ? 'done' : ''}><span>{done ? <FiCheck /> : null}</span>{label}</div>)}</div></section></aside> : null}
    </div>

    {editing ? <section className="profile-content-card profile-edit-form-card"><div className="profile-card-heading"><div><span className="eyebrow">EDIT DETAILS</span><h3>Update your profile</h3></div></div><form onSubmit={submit} className="profile-edit-form"><label>Full name<input name="name" value={form.name} onChange={updateField} maxLength={100} required /></label><label>Email address<input type="email" name="email" value={form.email} onChange={updateField} maxLength={255} required /></label><label>Phone number <span>Optional</span><input type="tel" name="mobile" value={form.mobile} onChange={updateField} pattern="[+]?(?:[0-9]|[(][0-9]{1,4}[)])[0-9 ().-]*[0-9]" title="Use 7 to 15 digits; spaces, parentheses, dots, dashes, and a leading plus are allowed." maxLength={20} /></label>{canViewCareerWorkspace ? <><label>Target job role<input name="targetRole" value={form.targetRole} onChange={updateField} maxLength={150} placeholder="e.g. Frontend Developer" /></label><label>Preferred location<input name="location" value={form.location} onChange={updateField} maxLength={200} placeholder="City, region, or country" /></label><label>Work mode<select name="workMode" value={form.workMode} onChange={updateField}><option>Any</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label></> : null}<div className="profile-form-actions"><button type="button" className="profile-cancel-button" onClick={() => setEditing(false)}>Cancel</button><button type="submit" className="interview-primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save profile'} <FiCheck /></button></div></form></section> : null}
  </div>;
}
