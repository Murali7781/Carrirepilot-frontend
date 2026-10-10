import { FiBookmark, FiBriefcase, FiExternalLink, FiEye, FiSend } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const parseSkills = (value) => {
  if (Array.isArray(value)) return value;
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return String(value || '').split(',').map((skill) => skill.trim()).filter(Boolean);
  }
};

export default function JobCard({ job, saved, application, onSave, onApply, applying, sourceMode }) {
  const skills = parseSkills(job.required_skills);

  return (
    <article className="job-card">
      <div className="job-card-main">
        <div className="company-avatar" aria-hidden="true">{job.company?.trim()?.charAt(0)?.toUpperCase() || <FiBriefcase />}</div>
        <div>
          <div className="job-card-title-row"><h3>{job.title}</h3></div>
          <p className="job-company">{job.company || 'Company not specified'}</p>
          <p className="job-description">{job.description?.slice(0, 180) || 'No job description was provided.'}</p>
          <div className="tag-row">
            {skills.slice(0, 4).map((skill) => <span key={skill} className="tag">{skill}</span>)}
          </div>
        </div>
      </div>
      <div className="job-card-actions">
        <button type="button" className={`icon-button ${saved ? 'saved' : ''}`} onClick={() => onSave(job)} aria-label={saved ? 'Remove saved job' : 'Save job'} title={saved ? 'Remove saved job' : 'Save job'}>
          <FiBookmark size={17} />
        </button>
        {(job.apply_url || job.source_url) ? <a className="btn btn-light btn-sm" href={job.apply_url || job.source_url} target="_blank" rel="noopener noreferrer"><FiExternalLink size={15} /> {sourceMode === 'live' ? 'Apply' : 'Posting'}</a> : null}
        <Link to={`/jobs/${job.id}`} className="btn btn-light btn-sm"><FiEye size={15} /> Details</Link>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onApply(job)} disabled={applying || Boolean(application)}>
          <FiSend size={15} /> {applying ? 'Saving…' : application ? `Tracked · ${application.status}` : 'Mark applied'}
        </button>
      </div>
    </article>
  );
}
