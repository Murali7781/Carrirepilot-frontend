import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBookmark, FiBriefcase, FiExternalLink, FiMapPin } from 'react-icons/fi';
import api from '../services/api';
import { applyToJob, getSavedJobs, saveJob, unsaveJob } from '../services/jobsService';

function formatSalary(job) {
  if (job.salary_min == null && job.salary_max == null) return 'Salary not listed';
  const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  const lower = job.salary_min == null ? null : formatter.format(Number(job.salary_min));
  const upper = job.salary_max == null ? null : formatter.format(Number(job.salary_max));
  const range = lower && upper ? `${lower}–${upper}` : `${lower || upper}+`;
  return `${job.salary_currency || ''} ${range}`.trim();
}

function normalizeSkills(value) {
  if (Array.isArray(value)) return value.map(String).map((skill) => skill.trim()).filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).map((skill) => skill.trim()).filter(Boolean);
  } catch {
    // Older/manual job records may use comma-separated skills.
  }
  return value.split(',').map((skill) => skill.trim()).filter(Boolean);
}

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [savedRecordId, setSavedRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const requiredSkills = normalizeSkills(job?.required_skills);

  useEffect(() => {
    let active = true;
    Promise.all([api.get(`/jobs/${id}`), api.get('/resumes'), getSavedJobs().catch(() => [])])
      .then(([jobResponse, resumeResponse, savedJobs]) => {
        if (!active) return;
        const foundJob = jobResponse.data.data.job;
        setJob(foundJob);
        const resumeList = resumeResponse.data.data.resumes || [];
        setResumes(resumeList);
        if (resumeList.length) setSelectedResumeId(String(resumeList[0].id));
        const saved = savedJobs.find((item) => String(item.job_id) === String(foundJob.id));
        if (saved) setSavedRecordId(saved.id);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Unable to load this job.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  const handleSave = async () => {
    setWorking('save');
    setError('');
    setNotice('');
    try {
      if (savedRecordId) {
        await unsaveJob(job.id, savedRecordId);
        setSavedRecordId(null);
        setNotice('Removed from your saved roles.');
      } else {
        const saved = await saveJob(job.id);
        setSavedRecordId(saved.id);
        setNotice('Saved to your shortlist.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update your saved roles.');
    } finally {
      setWorking('');
    }
  };

  const handleTrack = async () => {
    setWorking('track');
    setError('');
    setNotice('');
    try {
      const response = await applyToJob(job.id);
      setNotice(response.data.message === 'Application already exists'
        ? 'This role is already in your application tracker.'
        : 'Added to your application tracker. Open the original posting to complete the application.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to track this role.');
    } finally {
      setWorking('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedResumeId) {
      setError('Add a resume before running a match check.');
      return;
    }
    setWorking('analyze');
    setError('');
    setNotice('');
    try {
      const selectedResume = resumes.find((resume) => String(resume.id) === String(selectedResumeId));
      const response = await api.post(`/resumes/${selectedResumeId}/analyze`, { jobDescription: job.description || '', targetRole: selectedResume?.target_role || '' });
      setAnalysis(response.data.data.analysis);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to compare this resume with the listing.');
    } finally {
      setWorking('');
    }
  };

  if (loading) return <div className="page-loading">Loading role details…</div>;
  if (!job) return <div className="page-section"><div className="alert alert-danger">{error || 'Job not found.'}</div><Link to="/jobs">Back to job search</Link></div>;

  return (
    <div className="page-section job-detail-page">
      <Link to="/jobs" className="back-link"><FiArrowLeft /> Back to job search</Link>
      <section className="job-detail-hero panel-card">
        <div className="job-detail-identity">
          <div className="company-avatar company-avatar-large">{job.company?.trim()?.charAt(0)?.toUpperCase() || <FiBriefcase />}</div>
          <div>
            <div className="eyebrow">{job.source === 'adzuna' ? 'Live listing' : 'Sample opportunity'}</div>
            <h2>{job.title}</h2>
            <p>{job.company || 'Company not listed'}</p>
          </div>
        </div>
        <div className="job-detail-meta">
          {job.location ? <span><FiMapPin /> {job.location}</span> : null}
          {job.employment_type ? <span><FiBriefcase /> {job.employment_type}</span> : null}
          <span>{formatSalary(job)}</span>
        </div>
        <div className="job-detail-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={handleSave} disabled={working !== ''}>
            <FiBookmark /> {working === 'save' ? 'Saving…' : savedRecordId ? 'Saved' : 'Save role'}
          </button>
          <button type="button" className="btn btn-outline-primary" onClick={handleTrack} disabled={working !== ''}>
            {working === 'track' ? 'Saving…' : 'I applied · track'}
          </button>
          {job.apply_url ? <a className="btn btn-primary" href={job.apply_url} target="_blank" rel="noreferrer noopener">Open original posting <FiExternalLink /></a> : null}
        </div>
      </section>

      {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
      {notice ? <div className="alert alert-success" role="status">{notice}</div> : null}

      <div className="job-detail-grid">
        <section className="panel-card job-description-panel">
          <div className="panel-header"><div><span className="eyebrow">Role overview</span><h3>About this opportunity</h3></div></div>
          {job.source === 'adzuna' ? <p className="job-snippet-note">This is a summary from the listing provider. Open the original posting for the full description and current availability.</p> : null}
          <p className="job-full-description">{job.description || 'The employer has not supplied a description.'}</p>
          {job.experience_requirements ? <div className="detail-section"><h4>Experience</h4><p>{job.experience_requirements}</p></div> : null}
          {requiredSkills.length ? <div className="detail-section"><h4>Skills listed</h4><div className="tag-row">{requiredSkills.map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div></div> : null}
          {job.source === 'adzuna' ? <p className="listing-source"><a href="https://www.adzuna.com/" target="_blank" rel="noreferrer noopener">Jobs by Adzuna</a></p> : null}
        </section>

        <aside className="panel-card match-tool-panel">
          <span className="eyebrow">Resume match</span>
          <h3>Compare your resume</h3>
          <p>Check for relevant terms and basic resume sections. This is a heuristic guide, not a hiring prediction.</p>
          {resumes.length ? (
            <>
              <label className="form-label" htmlFor="resume-select">Choose a resume</label>
              <select id="resume-select" className="form-select" value={selectedResumeId} onChange={(event) => { setSelectedResumeId(event.target.value); setAnalysis(null); }}>
                {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.title}</option>)}
              </select>
              <button type="button" className="btn btn-primary w-100 mt-3" onClick={handleAnalyze} disabled={working !== ''}>
                {working === 'analyze' ? 'Comparing…' : 'Run match check'}
              </button>
            </>
          ) : <Link className="btn btn-primary w-100" to="/resumes">Add a resume</Link>}

          {analysis ? (
            <div className="match-result" aria-live="polite">
              <div className="match-result-score"><strong>{analysis.score}%</strong><span>keyword and structure score</span></div>
              <div><strong>Matched</strong><p>{analysis.matchedKeywords?.length ? analysis.matchedKeywords.join(', ') : 'No matching terms found.'}</p></div>
              <div><strong>Consider adding</strong><p>{analysis.missingKeywords?.length ? analysis.missingKeywords.slice(0, 10).join(', ') : 'No missing terms detected.'}</p></div>
              {analysis.recommendations?.length ? <ul>{analysis.recommendations.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul> : null}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
