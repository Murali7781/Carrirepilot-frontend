import { useEffect, useMemo, useState } from 'react';
import { FiBookmark, FiCheck, FiMapPin, FiSearch, FiShield, FiStar, FiBriefcase, FiEye } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [jobResponse, resumeResponse] = await Promise.all([
          api.get(`/jobs/${id}`),
          api.get('/resumes'),
        ]);

        setJob(jobResponse.data.data.job);
        const resumeList = resumeResponse.data.data.resumes || [];
        setResumes(resumeList);
        if (resumeList.length) {
          setSelectedResumeId(String(resumeList[0].id));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load job details.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const requiredSkills = useMemo(() => parseJsonArray(job?.required_skills), [job]);
  const preferredSkills = useMemo(() => parseJsonArray(job?.preferred_skills), [job]);

  const analyzeMatch = async () => {
    if (!selectedResumeId) {
      setError('Please select a resume to compare.');
      return;
    }

    try {
      const response = await api.post('/matches/analyze', {
        resumeId: Number(selectedResumeId),
        jobId: Number(id),
      });
      setMatchResult(response.data.data.result);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to analyze this role.');
    }
  };

  if (loading) {
    return <div className="page-loading">Loading job details...</div>;
  }

  if (!job) {
    return <div className="page-section"><div className="alert alert-danger">{error || 'Job not found.'}</div></div>;
  }

  return (
    <div className="page-section job-match-page">
      <div className="job-match-header">
        <div className="job-match-title-wrap">
          <div className="eyebrow">Best match</div>
          <h2>Your best job matches</h2>
        </div>
        <span className="status-indicator" aria-label="Live match status" />
      </div>

      <div className="job-match-shell">
        <div className="job-match-topbar">
          <div className="job-match-tabs" aria-label="Job tabs">
            <button type="button" className="job-tab active">Overview</button>
            <button type="button" className="job-tab">Company</button>
          </div>

          <div className="job-match-actions">
            <button type="button" className="job-action ghost">
              <FiCheck /> Already Applied?
            </button>
            <button type="button" className="job-action">
              <FiBookmark /> Save
            </button>
            <button type="button" className="job-action primary">
              Apply
            </button>
          </div>
        </div>

        <div className="job-company-strip">
          <div className="company-identity">
            <div className="company-logo">
              <FiBriefcase size={20} />
            </div>
            <div>
              <div className="company-name">{job.company || 'Company'}</div>
              <div className="company-subtitle">Enterprise AI solutions with validated data</div>
            </div>
          </div>

          <div className="company-icons" aria-label="Job actions">
            <button type="button" className="mini-icon" aria-label="Open job"><FiEye /></button>
            <button type="button" className="mini-icon" aria-label="Save job"><FiBookmark /></button>
            <button type="button" className="mini-icon" aria-label="Share job"><FiSearch /></button>
          </div>
        </div>

        <div className="job-headline-wrap">
          <h3>{job.title}</h3>
        </div>

        <div className="job-pill-row">
          <span className="job-pill">Fall 2026</span>
          <span className="job-pill muted">Confirmed live in the last 24 hours</span>
          <span className="job-pill highlight">Unlock job analytics with CareerPilot+</span>
        </div>

        <div className="job-meta-row">
          <div className="meta-item"><FiSearch /> No salary listed</div>
          <div className="meta-item"><FiStar /> Internship</div>
          <div className="meta-item"><FiMapPin /> {job.location || 'Hybrid, Telangana, India'}</div>
        </div>

        <div className="job-content-row">
          <div className="job-details-panel">
            <div className="job-panel-header">
              <h4>About the job</h4>
              <div className="segmented-control">
                <button type="button" className="segmented active">Summary</button>
                <button type="button" className="segmented">Full posting</button>
              </div>
            </div>

            <div className="job-copy-block">
              <div className="section-label">Requirements</div>
              <ul>
                {requiredSkills.length ? requiredSkills.map((skill) => <li key={skill}>{skill}</li>) : <li>No required skills listed.</li>}
              </ul>
            </div>

            <div className="job-copy-block">
              <div className="section-label">Responsibilities</div>
              <p>{job.description || 'No detailed responsibilities were provided for this role.'}</p>
            </div>
          </div>

          <aside className="resume-panel">
            <div className="resume-panel-header">
              <div className="resume-badge"><FiShield /></div>
              <h4>Improve Your Resume</h4>
            </div>

            <p className="resume-target">1 out of 4 required keywords found</p>

            <div className="keyword-row">
              {preferredSkills.length ? preferredSkills.slice(0, 4).map((skill) => <span key={skill} className="keyword-tag">{skill}</span>) : <span className="keyword-tag">Skills</span>}
            </div>

            <button type="button" className="resume-cta" onClick={analyzeMatch} disabled={!resumes.length}>
              {resumes.length ? 'Tailor my resume' : 'Add a resume'}
            </button>

            {resumes.length ? (
              <div className="resume-select-wrap">
                <label htmlFor="resume-select">Resume</label>
                <select id="resume-select" value={selectedResumeId} onChange={(event) => setSelectedResumeId(event.target.value)}>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>{resume.title}</option>
                  ))}
                </select>
              </div>
            ) : null}
          </aside>
        </div>

        {error ? <div className="alert alert-danger mt-3">{error}</div> : null}

        {matchResult ? (
          <div className="match-summary mt-3">
            <h4>Match summary</h4>
            <div className="badge-large">{matchResult.matchPercentage}%</div>
            <ul className="mt-3">
              <li>Matching skills: {matchResult.matchingSkills.length ? matchResult.matchingSkills.join(', ') : 'None'}</li>
              <li>Missing skills: {matchResult.missingSkills.length ? matchResult.missingSkills.join(', ') : 'No major gaps'}</li>
              <li>Partial skills: {matchResult.partialSkills.length ? matchResult.partialSkills.join(', ') : 'None'}</li>
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
