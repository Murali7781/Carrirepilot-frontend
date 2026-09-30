import { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/resumes.css';

const emptyForm = {
  title: '',
  target_role: '',
  professional_summary: '',
  skills: '',
};

const roleDescriptions = {
  'Frontend Engineer': 'Build accessible, responsive web interfaces using React, JavaScript, HTML, and CSS. Collaborate with design and backend teams, translate product requirements into reusable components, integrate APIs, write automated tests, improve performance, and support production releases. Required skills: React, JavaScript, HTML, CSS, accessibility, REST APIs, Git, and testing.',
  'Software Engineer': 'Design, build, test, and maintain dependable software that solves user and business problems. Work with product and engineering partners, review code, improve existing systems, diagnose defects, and communicate trade-offs. Required skills: programming fundamentals, data structures, APIs, SQL, testing, Git, and clear technical communication.',
  'Backend Developer': 'Design, build, and maintain secure backend services and APIs. Model relational data, implement authentication and validation, write reliable tests, monitor performance, and collaborate across product and engineering. Required skills: Node.js, SQL, API design, authentication, testing, Git, and cloud fundamentals.',
  'Full Stack Developer': 'Deliver features across responsive web interfaces and backend services. Build reusable UI, integrate APIs, design data models, write tests, review code, and help operate production services. Required skills: JavaScript, React, Node.js, SQL, REST APIs, Git, and testing.',
  'Data Analyst': 'Analyze business data and communicate clear recommendations. Build reliable SQL queries, clean datasets, maintain dashboards, validate metrics, and partner with stakeholders to answer operational questions. Required skills: SQL, spreadsheets, data visualization, statistics, communication, and data quality.',
  'Product Designer': 'Turn user and business needs into clear product experiences. Conduct discovery, map workflows, prototype interactions, test designs with users, maintain design systems, and work closely with engineering. Required skills: user research, interaction design, prototyping, Figma, accessibility, and communication.',
  'UX Designer': 'Research user needs and design usable, accessible digital experiences. Create journey maps, wireframes, prototypes, and test plans; synthesize feedback and collaborate with product and engineering. Required skills: UX research, information architecture, interaction design, prototyping, accessibility, and Figma.',
  'DevOps Engineer': 'Improve the reliability and delivery of cloud services. Automate CI/CD, infrastructure, monitoring, and incident response; partner with developers to improve security and release quality. Required skills: Linux, cloud platforms, containers, CI/CD, infrastructure as code, scripting, and observability.',
  'QA Engineer': 'Protect product quality through risk-based testing. Design test plans, reproduce and document defects, automate critical workflows, validate releases, and collaborate with product and engineering. Required skills: test design, exploratory testing, API testing, automation, SQL, and clear communication.',
  'Cybersecurity Analyst': 'Monitor systems for security risks, investigate alerts, document incidents, and help teams reduce vulnerabilities. Review access controls, support security assessments, and communicate practical remediation steps. Required skills: networking, Linux, security fundamentals, incident response, log analysis, and clear documentation.',
  'Data Scientist': 'Use statistical analysis and machine learning to answer product and business questions. Prepare reliable datasets, evaluate models, communicate uncertainty, and partner with stakeholders to put useful insights into practice. Required skills: Python, SQL, statistics, experimentation, data visualization, and model evaluation.',
  'Product Manager': 'Set product priorities using customer needs, business outcomes, and evidence. Align design and engineering partners, define clear requirements, track outcomes, and communicate decisions and trade-offs. Required skills: discovery, prioritization, analytics, writing, stakeholder management, and product delivery.',
  'Project Manager': 'Coordinate cross-functional work from planning through delivery. Maintain clear milestones, identify dependencies and risks, facilitate decisions, communicate progress, and help teams resolve blockers. Required skills: planning, communication, risk management, facilitation, and delivery tracking.',
};

const parseSkillText = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  return String(skills)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

function getResumePayload(form) {
  return {
    ...form,
    skills: parseSkillText(form.skills),
  };
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [resumeFile, setResumeFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const loadResumes = async () => {
    try {
      const response = await api.get('/resumes');
      setResumes(response.data.data.resumes || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load resumes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    api.get('/resumes')
      .then((response) => {
        if (active) setResumes(response.data.data.resumes || []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Unable to load resumes.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setError('');
    setAnalysis(null);

    if (file && !file.name.toLowerCase().endsWith('.pdf')) {
      setResumeFile(null);
      setError('Choose a PDF file. Other formats are not supported yet.');
      event.target.value = '';
      return;
    }

    if (file && file.size > 10 * 1024 * 1024) {
      setResumeFile(null);
      setError('PDF files must be 10 MB or smaller.');
      event.target.value = '';
      return;
    }

    setResumeFile(file);
    if (file) {
      setForm((current) => ({
        ...current,
        title: current.title || file.name.replace(/\.pdf$/i, ''),
      }));
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setResumeFile(null);
    setIsEditing(false);
    setSelectedId(null);
    setAnalysis(null);
    setJobDescription('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setAnalysis(null);

    try {
      const payload = getResumePayload(form);
      let response;

      if (resumeFile) {
        const body = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          body.append(key, Array.isArray(value) ? value.join(', ') : value);
        });
        body.append('resume', resumeFile);
        response = isEditing && selectedId
          ? await api.put(`/resumes/${selectedId}`, body, { headers: { 'Content-Type': 'multipart/form-data' } })
          : await api.post('/resumes', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        response = isEditing && selectedId
          ? await api.put(`/resumes/${selectedId}`, payload)
          : await api.post('/resumes', payload);
      }

      const savedResume = response.data.data.resume;
      setSelectedId(savedResume.id);
      setResumeFile(null);
      setIsEditing(false);
      setForm({
        title: savedResume.title || '',
        professional_summary: savedResume.professional_summary || '',
        skills: parseSkillText(savedResume.skills).join(', '),
      });
      await loadResumes();

      if (jobDescription.trim()) {
        try {
          const analysisResponse = await api.post(`/resumes/${savedResume.id}/analyze`, { jobDescription, targetRole: form.target_role });
          setAnalysis({ resumeId: savedResume.id, ...analysisResponse.data.data.analysis });
          await loadResumes();
        } catch (err) {
          setError(err.response?.data?.message || 'Resume saved, but the ATS check could not be completed.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save resume.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (resume) => {
    setForm({
      title: resume.title || '',
      target_role: resume.target_role || '',
      professional_summary: resume.professional_summary || '',
      skills: parseSkillText(resume.skills || []).join(', '),
    });
    setResumeFile(null);
    setSelectedId(resume.id);
    setIsEditing(true);
    setAnalysis(null);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!selectedId) {
      setError('Save or select a resume before running an ATS check.');
      return;
    }

    setAnalyzing(true);
    setError('');
    try {
      const response = await api.post(`/resumes/${selectedId}/analyze`, { jobDescription, targetRole: form.target_role });
      setAnalysis({ resumeId: selectedId, ...response.data.data.analysis });
      setResumes((current) => current.map((resume) => String(resume.id) === String(selectedId)
        ? { ...resume, ats_score: response.data.data.analysis.score, ats_role: form.target_role, ats_analyzed_at: new Date().toISOString() }
        : resume));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to analyze this resume.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePreview = async (resume) => {
    setError('');
    try {
      const response = await api.get(`/resumes/${resume.id}/file`, { responseType: 'blob' });
      setPreviewUrl((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(response.data); });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to preview this PDF.');
    }
  };

  const handleDownload = async (resume) => {
    setDownloadingId(resume.id);
    setError('');
    try {
      const response = await api.get(`/resumes/${resume.id}/file`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = resume.original_file_name || `${resume.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to download this PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await api.delete(`/resumes/${id}`);
      if (selectedId === id) resetForm();
      await loadResumes();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete resume.');
    }
  };

  if (loading) {
    return <div className="page-loading">Loading resumes...</div>;
  }

  return (
    <div className="page-section resume-studio">
      <header className="resume-hero">
        <div>
          <span className="resume-eyebrow">CAREERPILOT RESUME STUDIO</span>
          <h2>Build a resume that gets noticed.</h2>
          <p>Upload a PDF, keep your versions organized, and check it against the job you want.</p>
        </div>
        <div className="resume-hero-badge"><span>PDF</span><small>Upload · Review · Tailor</small></div>
      </header>

      {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}

      <div className="row g-4 align-items-start">
        <div className="col-lg-5">
          <section className="panel-card resume-editor">
            <div className="panel-header">
              <div>
                <span className="resume-step">YOUR RESUME</span>
                <h3>{isEditing ? 'Edit a version' : 'Add a resume'}</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-12">
                <label className="form-label" htmlFor="resume-file">Resume PDF</label>
                <label className="resume-dropzone" htmlFor="resume-file">
                  <span className="resume-file-icon">↑</span>
                  <strong>{resumeFile ? resumeFile.name : 'Choose a PDF to upload'}</strong>
                  <small>{resumeFile ? `${(resumeFile.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF only · Max 10 MB'}</small>
                  <input
                    id="resume-file"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                  />
                </label>
                {isEditing ? <div className="form-hint">Leave this empty to keep the current PDF.</div> : null}
                <div className="form-hint">To change the PDF’s actual text or layout, edit it in your document editor and upload the revised PDF. The fields below save your CareerPilot resume profile.</div>
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="resume-title">Resume name</label>
                <input id="resume-title" className="form-control" name="title" value={form.title} onChange={handleChange} required maxLength={150} />
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="resume-role">Target role</label>
                <select id="resume-role" className="form-select" name="target_role" value={form.target_role} onChange={(event) => {
                  const role = event.target.value;
                  setForm((current) => ({ ...current, target_role: role }));
                  if (roleDescriptions[role]) { setJobDescription(roleDescriptions[role]); setAnalysis(null); }
                }}>
                  <option value="">Choose a role</option>
                  {Object.keys(roleDescriptions).map((role) => <option key={role} value={role}>{role}</option>)}
                  {form.target_role && !roleDescriptions[form.target_role] ? <option value={form.target_role}>{form.target_role}</option> : null}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="resume-summary">Professional summary</label>
                <textarea id="resume-summary" className="form-control" name="professional_summary" value={form.professional_summary} onChange={handleChange} rows={4} />
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="resume-skills">Skills</label>
                <input id="resume-skills" className="form-control" name="skills" value={form.skills} onChange={handleChange} />
              </div>

              <div className="col-12 resume-divider" />
              <div className="col-12">
                <label className="form-label" htmlFor="job-description">Target job description <span className="form-optional">OPTIONAL</span></label>
                <textarea id="job-description" className="form-control" rows={5} value={jobDescription} onChange={(event) => { setJobDescription(event.target.value); setAnalysis(null); }} />
                <div className="form-hint">The ATS readiness score is a guideline based on readable text, resume sections, and matching job keywords.</div>
              </div>

              {analysis ? (
                <div className="col-12 resume-analysis">
                  <div className="analysis-score">
                    <span className="analysis-score-number">{analysis.score}%</span>
                    <span><strong>ATS readiness</strong><small>Resume and job match</small></span>
                  </div>
                  <div className="analysis-keywords">
                    <div><strong>Found</strong><p>{analysis.matchedKeywords.length ? analysis.matchedKeywords.join(', ') : 'No matching keywords yet'}</p></div>
                    <div><strong>Consider adding</strong><p>{analysis.missingKeywords.length ? analysis.missingKeywords.join(', ') : 'No missing keywords detected'}</p></div>
                  </div>
                  {analysis.recommendations.length ? (
                    <ul className="analysis-recommendations">
                      {analysis.recommendations.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : <p className="analysis-clear">All listed checks passed. Review each suggestion for accuracy.</p>}
                  <div className="analysis-checks">
                    {analysis.checks.map((check) => (
                      <span className={check.passed ? 'check-passed' : 'check-missing'} key={check.label}>
                        {check.passed ? '✓' : '·'} {check.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="col-12 d-flex flex-wrap justify-content-between gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Clear</button>
                <div className="d-flex flex-wrap gap-2">
                  {selectedId ? (
                    <button type="button" className="btn btn-outline-primary" onClick={handleAnalyze} disabled={analyzing || !jobDescription.trim()}>
                      {analyzing ? 'Checking...' : 'Check ATS score'}
                    </button>
                  ) : null}
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Save resume'}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>

        <div className="col-lg-7">
          <section className="panel-card resume-library">
            <div className="panel-header">
              <div>
                <span className="resume-step">YOUR LIBRARY</span>
                <h3>Saved resumes <span className="resume-count">{resumes.length}</span></h3>
              </div>
            </div>

            {resumes.length ? (
              <div className="resume-list">
                {resumes.map((resume) => (
                  <article key={resume.id} className={`resume-card${selectedId === resume.id ? ' resume-card-selected' : ''}`}>
                    <div className="resume-card-icon">PDF</div>
                    <div className="resume-card-content">
                      <strong>{resume.title}</strong>
                      <div className="resume-card-meta">
                        {resume.original_file_name ? <span>{resume.original_file_name}</span> : <span>Resume profile</span>}
                        {resume.target_role ? <span>Target: {resume.target_role}</span> : null}
                        {resume.ats_score != null ? <span className="resume-ats-score">ATS {resume.ats_score}%{resume.ats_role ? ` · ${resume.ats_role}` : ''}</span> : null}
                        <span>{parseSkillText(resume.skills || []).slice(0, 4).join(' · ') || 'Add skills to improve your profile'}</span>
                      </div>
                      {resume.professional_summary ? <p>{resume.professional_summary.slice(0, 140)}</p> : null}
                      <div className="resume-card-actions">
                        {resume.original_file_name ? <button type="button" className="resume-text-button" onClick={() => handlePreview(resume)}>Preview PDF</button> : null}
                        {resume.original_file_name ? (
                          <button type="button" className="resume-text-button" onClick={() => handleDownload(resume)} disabled={downloadingId === resume.id}>
                            {downloadingId === resume.id ? 'Downloading…' : 'Download PDF'}
                          </button>
                        ) : null}
                        <button type="button" className="resume-text-button" onClick={() => handleEdit(resume)}>Edit</button>
                        <button type="button" className="resume-text-button resume-delete-button" onClick={() => handleDelete(resume.id)}>Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="resume-empty">
                <span>✦</span>
                <strong>Your resume versions will appear here</strong>
                <p>Start by uploading your current resume as a PDF.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {previewUrl ? <div className="resume-preview-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setPreviewUrl(''); }}>
        <section className="resume-preview-dialog" role="dialog" aria-modal="true" aria-label="Resume PDF preview">
          <div className="resume-preview-header"><strong>PDF preview</strong><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setPreviewUrl('')}>Close</button></div>
          <iframe title="Resume PDF preview" src={previewUrl} />
        </section>
      </div> : null}
    </div>
  );
}
