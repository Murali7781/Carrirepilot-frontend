import { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiArrowLeft, FiBookmark, FiCheck, FiExternalLink, FiFileText, FiTarget } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

const parseJsonArray = (value) => {
  if (value == null || value === '') return [];
  let parsed = value;
  for (let attempt = 0; attempt < 2 && typeof parsed === 'string'; attempt += 1) {
    try { parsed = JSON.parse(parsed); } catch { break; }
  }
  const items = Array.isArray(parsed) ? parsed : typeof parsed === 'string' ? parsed.split(/[,;|\n]/) : [];
  return [...new Set(items.map((item) => {
    if (typeof item === 'string') return item.trim();
    if (item && typeof item === 'object') return String(item.name || item.skill || item.label || '').trim();
    return '';
  }).filter(Boolean))];
};

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [savedRecord, setSavedRecord] = useState(null);
  const [application, setApplication] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedId, setLoadedId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get(`/jobs/${id}`), api.get('/resumes')])
      .then(([jobResponse, resumeResponse]) => {
        if (!active) return;
        const nextJob = jobResponse.data?.data?.job;
        const resumeList = resumeResponse.data?.data?.resumes || [];
        setJob(nextJob || null); setResumes(resumeList); setLoadedId(String(id)); setError('');
        if (resumeList.length) setSelectedResumeId(String(resumeList[0].id));
        setSavedRecord(nextJob?.saved_job_id ? { id: nextJob.saved_job_id, job_id: nextJob.id } : null);
        setApplication(nextJob?.application_id ? { id: nextJob.application_id, status: nextJob.application_status } : null);
      })
      .catch((err) => { if (active) { setJob(null); setError(err.response?.data?.message || 'Unable to load this role.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const requiredSkills = useMemo(() => parseJsonArray(job?.required_skills), [job]);
  const preferredSkills = useMemo(() => parseJsonArray(job?.preferred_skills), [job]);

  const toggleSave = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      if (savedRecord) { await api.delete(`/saved-jobs/${savedRecord.id}`); setSavedRecord(null); setNotice('Role removed from your saved list.'); }
      else { const response = await api.post('/saved-jobs', { jobId: Number(id) }); setSavedRecord(response.data?.data?.savedJob || null); setNotice('Role saved to your shortlist.'); }
    } catch (err) { setError(err.response?.data?.message || 'Unable to update your saved roles.'); }
    finally { setSaving(false); }
  };

  const markApplied = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await api.post('/applications', { jobId: Number(id) });
      setApplication(response.data?.data?.application || application);
      setNotice('Application tracker updated. CareerPilot has not submitted an application to the employer.');
    } catch (err) { setError(err.response?.data?.message || 'Unable to update your application tracker.'); }
    finally { setSaving(false); }
  };

  const analyzeMatch = async () => {
    if (!selectedResumeId) { setError('Create a resume before comparing it with this role.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await api.post('/matches/analyze', { resumeId: Number(selectedResumeId), jobId: Number(id) });
      setMatchResult(response.data?.data?.result || null);
    } catch (err) { setError(err.response?.data?.message || 'Unable to compare this resume with the role.'); }
    finally { setSaving(false); }
  };

  if (loading || loadedId !== String(id)) return <div className="page-loading" role="status">Loading role details…</div>;
  if (!job) return <div className="page-section"><div className="alert alert-danger" role="alert">{error || 'This role was not found in your workspace.'}</div><Link to="/jobs">Back to roles</Link></div>;

  return <div className="page-section job-match-page">
    <div className="job-detail-heading"><Link to="/jobs"><FiArrowLeft /> Back to roles</Link><span className="eyebrow">ROLE REVIEW</span><h2>{job.title}</h2><p>{[job.company, job.location].filter(Boolean).join(' · ') || 'Company and location not provided'}</p><div className="job-detail-meta"><span>{job.experience_requirements || 'Experience not specified'}</span><span>{requiredSkills.length} required skills</span>{job.created_at ? <span>Added {new Date(job.created_at).toLocaleDateString()}</span> : null}</div></div>
    <div className="job-match-shell">
      <div className="job-match-actions job-detail-actions"><button type="button" className="job-action" onClick={toggleSave} disabled={saving}><FiBookmark /> {savedRecord ? 'Saved · remove' : 'Save role'}</button>{job.source_url ? <a className="job-action primary" href={job.source_url} target="_blank" rel="noopener noreferrer">View employer posting <FiExternalLink /></a> : null}<button type="button" className="job-action" onClick={markApplied} disabled={saving || Boolean(application)}><FiCheck /> {application ? `Application tracked · ${application.status}` : 'I applied · track it'}</button><Link className="job-action" to={`/interviews?jobId=${job.id}${selectedResumeId ? `&resumeId=${selectedResumeId}` : ''}`}><FiActivity /> Practice interview</Link></div>
      {notice ? <div className="alert alert-info" role="status">{notice}</div> : null}{error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
      <div className="job-content-row">
        <article className="job-details-panel"><div className="job-panel-header"><div><span className="eyebrow">JOB POSTING</span><h3>What this role involves</h3></div></div>
          <div className="job-copy-block"><div className="section-label">Description</div><p className="job-posting-copy">{job.description || 'No description was added for this role.'}</p></div>
          <div className="job-copy-block"><div className="section-label">Required skills</div>{requiredSkills.length ? <div className="keyword-row">{requiredSkills.map((skill) => <span className="keyword-tag" key={skill}>{skill}</span>)}</div> : <p>No required skills were provided in this posting.</p>}</div>
          <div className="job-copy-block"><div className="section-label">Preferred skills</div>{preferredSkills.length ? <div className="keyword-row">{preferredSkills.map((skill) => <span className="keyword-tag" key={skill}>{skill}</span>)}</div> : <p>No preferred skills were provided.</p>}</div>
          <div className="job-copy-block"><div className="section-label">Experience requirements</div><p>{job.experience_requirements || 'Not specified in the posting.'}</p></div>
        </article>
        <aside className="resume-panel job-resume-panel"><div className="resume-panel-header"><div className="resume-badge"><FiTarget /></div><div><h4>Compare your resume</h4><p>Check how your saved skills align with this posting.</p></div></div>
          {resumes.length ? <><div className="resume-select-wrap"><label htmlFor="resume-select">Choose a resume</label><select id="resume-select" value={selectedResumeId} onChange={(event) => setSelectedResumeId(event.target.value)}>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.title}</option>)}</select></div><button type="button" className="resume-cta" onClick={analyzeMatch} disabled={saving}>{saving ? 'Working…' : 'Compare resume'}</button></> : <div className="resume-no-resume"><FiFileText /><p>You need a saved resume before CareerPilot can compare skills with this role.</p><Link to="/resumes">Build a resume</Link></div>}
          {matchResult ? <div className="match-summary"><h4>ATS-style fit estimate</h4><div className="badge-large">{matchResult.atsScore == null ? '—' : `${matchResult.atsScore}%`}</div><p className="job-match-score-note">Estimate from listed skills and resume section coverage. It is not an employer ATS score or hiring prediction.</p><ul><li>Required skills found: {matchResult.matchingSkills?.length ? matchResult.matchingSkills.join(', ') : 'None found'}</li><li>Required skills to review: {matchResult.missingSkills?.length ? matchResult.missingSkills.join(', ') : 'No listed gaps found'}</li><li>Preferred skills found: {matchResult.matchingPreferredSkills?.length ? matchResult.matchingPreferredSkills.join(', ') : 'None found'}</li></ul><button type="button" className="resume-cta" onClick={() => window.dispatchEvent(new Event('careerpilot:open-coach'))}>Ask CareerPilot about these gaps</button><Link to={`/resumes`}>Open resume improvement workspace</Link></div> : null}
        </aside>
      </div>
      <p className="job-tracker-disclaimer">“Mark as applied” records a status in CareerPilot only. Use the employer’s posting to submit your application, then return here to track its progress.</p>
    </div>
  </div>;
}
