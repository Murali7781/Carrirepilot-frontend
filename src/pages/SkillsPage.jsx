import { useEffect, useState } from 'react';
import { FiActivity, FiTarget } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/skills/gaps')
      .then((response) => { if (active) setSkills(Array.isArray(response.data?.data?.skills) ? response.data.data.skills : []); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load resume comparisons.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="page-loading" role="status">Loading skill comparisons…</div>;

  return <div className="page-section"><div className="page-heading"><div><div className="eyebrow">Resume comparisons</div><h2>Skills to review</h2><p>These are required skills from job descriptions that were not found in the selected resume’s skills list.</p></div></div>
    {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
    {skills.length ? <div className="row g-3">{skills.map((skill) => <div key={skill.id} className="col-md-6"><article className="skill-card"><div className="skill-head"><strong>{skill.skill_name}</strong><FiTarget aria-hidden="true" /></div><p>Not listed in <strong>{skill.resume_title}</strong> when compared with <strong>{skill.role_title}</strong>.</p>{skill.job_id ? <div className="skill-module-links"><Link to={`/jobs/${skill.job_id}`}>Review role</Link><Link to={`/interviews?jobId=${skill.job_id}`}><FiActivity /> Practice for it</Link></div> : <span>This role is no longer in your workspace.</span>}</article></div>)}</div> : <div className="panel-card empty-state"><div className="empty-icon"><FiTarget /></div><h3>No skill comparisons yet</h3><p>Save a resume, add a real job posting, and compare the two to see skills from that role that are missing from the resume.</p><Link to="/jobs" className="btn btn-primary btn-sm">Find roles</Link></div>}
  </div>;
}
