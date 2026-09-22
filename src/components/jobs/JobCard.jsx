import { FiBookmark, FiExternalLink, FiSend } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const parseSkills = (value) => {
  if (Array.isArray(value)) return value;
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return String(value || '').split(',').map((skill) => skill.trim()).filter(Boolean);
  }
};

export default function JobCard({ job, saved, onSave, onApply, applying }) {
  const skills = parseSkills(job.required_skills);

  return (
    <article className="job-card">
      <div className="job-card-main">
        <div className="company-avatar">{job.company?.charAt(0)?.toUpperCase() || 'J'}</div>
        <div>
          <div className="job-card-title-row">
            <h3>{job.title}</h3>
            <span className="status-dot" aria-label="Recently added" />
          </div>
          <p className="job-company">{job.company || 'Company not specified'}</p>
          <p className="job-description">{job.description?.slice(0, 180) || 'Review this opportunity and compare it with your profile.'}</p>
          <div className="tag-row">
            {skills.slice(0, 4).map((skill) => <span key={skill} className="tag">{skill}</span>)}
          </div>
        </div>
      </div>
      <div className="job-card-actions">
        <button type="button" className={`icon-button ${saved ? 'saved' : ''}`} onClick={() => onSave(job)} aria-label={saved ? 'Remove saved job' : 'Save job'} title={saved ? 'Remove saved job' : 'Save job'}>
          <FiBookmark size={17} />
        </button>
        <Link to={`/jobs/${job.id}`} className="btn btn-light btn-sm"><FiExternalLink size={15} /> View</Link>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onApply(job)} disabled={applying}>
          <FiSend size={15} /> {applying ? 'Applying...' : 'Apply'}
        </button>
      </div>
    </article>
  );
}
