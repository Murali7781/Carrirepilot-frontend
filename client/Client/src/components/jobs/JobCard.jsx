import { FiBookmark, FiBriefcase, FiExternalLink, FiMapPin, FiSend } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const parseSkills = (value) => {
  if (Array.isArray(value)) return value;
  try {
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value || '').split(',').map((skill) => skill.trim()).filter(Boolean);
  }
};

function formatSalary(job) {
  if (job.salary_min == null && job.salary_max == null) return null;
  const currency = job.salary_currency || '';
  const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  const minimum = job.salary_min == null ? null : formatter.format(Number(job.salary_min));
  const maximum = job.salary_max == null ? null : formatter.format(Number(job.salary_max));
  if (minimum && maximum) return `${currency} ${minimum}–${maximum}`.trim();
  return `${currency} ${minimum || maximum}+`.trim();
}

export default function JobCard({ job, saved, onSave, onApply, applying }) {
  const skills = parseSkills(job.required_skills);
  const salary = formatSalary(job);

  return (
    <article className="job-card">
      <div className="job-card-main">
        <div className="company-avatar" aria-hidden="true">{job.company?.trim()?.charAt(0)?.toUpperCase() || <FiBriefcase />}</div>
        <div className="job-card-copy">
          <div className="job-card-title-row">
            <h3>{job.title}</h3>
            {job.source === 'adzuna' ? <span className="job-source-pill">Live listing</span> : <span className="job-source-pill job-source-demo">Sample</span>}
          </div>
          <p className="job-company">{job.company || 'Company not listed'}</p>
          <div className="job-meta-row-compact">
            {job.location ? <span><FiMapPin /> {job.location}</span> : null}
            {job.employment_type ? <span><FiBriefcase /> {job.employment_type}</span> : null}
            {salary ? <span>{salary}</span> : null}
          </div>
          <p className="job-description">{job.description || 'No summary was provided. Open the original posting for the full details.'}</p>
          {skills.length ? <div className="tag-row">{skills.slice(0, 4).map((skill) => <span key={skill} className="tag">{skill}</span>)}</div> : null}
        </div>
      </div>
      <div className="job-card-actions">
        <button type="button" className={`icon-button ${saved ? 'saved' : ''}`} onClick={() => onSave(job)} aria-label={saved ? 'Remove saved job' : 'Save job'} title={saved ? 'Remove saved job' : 'Save job'}>
          <FiBookmark size={17} />
        </button>
        <Link to={`/jobs/${job.id}`} className="btn btn-light btn-sm">Details</Link>
        {job.apply_url ? <a className="btn btn-outline-primary btn-sm" href={job.apply_url} target="_blank" rel="noreferrer noopener">Original posting <FiExternalLink size={14} /></a> : null}
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onApply(job)} disabled={applying}>
          <FiSend size={15} /> {applying ? 'Saving…' : 'I applied · track'}
        </button>
      </div>
    </article>
  );
}
