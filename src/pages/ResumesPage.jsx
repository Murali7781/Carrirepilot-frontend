import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiActivity, FiArrowLeft, FiArrowRight, FiCheck, FiDownload, FiFileText, FiPlus, FiTarget, FiTrash2, FiUpload, FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const steps = ['Basics', 'Summary', 'Experience', 'Education', 'Skills', 'Projects', 'Certifications', 'Review'];
const MAX_IMPORT_SIZE = 8 * 1024 * 1024;
const acceptedPdfTypes = new Set(['', 'application/pdf', 'application/x-pdf', 'application/octet-stream']);
const itemDefinitions = {
  experience: { title: 'Experience', help: 'Add your most relevant roles first.', empty: 'No experience added. This section is optional.', fields: [['title', 'Role title'], ['company', 'Company'], ['location', 'Location'], ['start_date', 'Start date', 'month'], ['end_date', 'End date', 'month'], ['description', 'Impact and responsibilities', 'textarea']] },
  education: { title: 'Education', help: 'Include degrees, courses, and relevant training.', empty: 'No education added yet. This section is optional.', fields: [['degree', 'Degree or qualification'], ['institution', 'Institution'], ['location', 'Location'], ['start_date', 'Start date', 'month'], ['end_date', 'End date', 'month'], ['details', 'Relevant details', 'textarea']] },
  projects: { title: 'Projects', help: 'Show work that demonstrates your skills.', empty: 'No projects added yet. This section is optional.', fields: [['name', 'Project name'], ['link', 'Project link'], ['technologies', 'Technologies'], ['description', 'What you built and the result', 'textarea']] },
  certifications: { title: 'Certifications', help: 'Add certifications that support your target role.', empty: 'No certifications added yet. This section is optional.', fields: [['name', 'Certification'], ['issuer', 'Issuing organization'], ['issue_date', 'Issue date', 'month'], ['credential_url', 'Credential link']] },
};
const entryFieldLimits = { title: 160, company: 200, location: 160, start_date: 16, end_date: 16, description: 4000, degree: 200, institution: 200, details: 3000, name: 200, link: 500, technologies: 500, issuer: 200, issue_date: 16, credential_url: 500 };

function parseJson(value, fallback) {
  if (value == null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function createEmptyResume(user) {
  return { title: '', professional_summary: '', personal_info: { full_name: user?.name || '', email: user?.email || '', phone: user?.mobile || '', location: '', linkedin: '', portfolio: '' }, experience: [], education: [], skills: '', projects: [], certifications: [] };
}

function resumeToForm(resume, user) {
  const personal = parseJson(resume.personal_info, {}) || {};
  const skills = parseJson(resume.skills, []);
  return {
    ...createEmptyResume(user),
    title: resume.title || '',
    professional_summary: resume.professional_summary || '',
    personal_info: { ...createEmptyResume(user).personal_info, ...personal },
    experience: parseJson(resume.experience, []),
    education: parseJson(resume.education, []),
    projects: parseJson(resume.projects, []),
    certifications: parseJson(resume.certifications, []),
    skills: Array.isArray(skills) ? skills.join(', ') : String(skills || ''),
  };
}

function formatUpdatedAt(value) {
  if (!value) return 'recently';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleDateString();
}

function safeResumeLink(value) {
  if (!value) return '';
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
}

function TextField({ label, value, onChange, type = 'text', required = false, multiline = false, maxLength = 255 }) {
  const Field = multiline ? 'textarea' : 'input';
  return <label className="resume-field"><span>{label}{required ? <b aria-hidden="true"> *</b> : null}</span><Field type={multiline ? undefined : type} value={value || ''} onChange={(event) => onChange(event.target.value)} required={required} maxLength={multiline ? 4000 : maxLength} rows={multiline ? 4 : undefined} /></label>;
}

function ScoreMeter({ label, value, detail }) {
  const score = value != null && value !== '' && Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : null;
  return <div className="resume-score-meter">
    <div className="resume-score-meter-head"><strong>{label}</strong><b>{score == null ? '—' : `${score}%`}</b></div>
    <div className="resume-score-track" role="img" aria-label={`${label}: ${score == null ? 'not available' : `${score}%`}`}>
      <span style={{ width: `${score ?? 0}%` }} />
    </div>
    <small>{detail}</small>
  </div>;
}

function ResumeMatchReport({ analysis }) {
  const score = analysis.atsScore != null && analysis.atsScore !== '' && Number.isFinite(Number(analysis.atsScore)) ? Math.max(0, Math.min(100, Number(analysis.atsScore))) : null;
  const breakdown = analysis.scoreBreakdown || {};
  const required = breakdown.requiredSkillCoverage != null && Number.isFinite(Number(breakdown.requiredSkillCoverage)) ? Number(breakdown.requiredSkillCoverage) : null;
  const preferred = breakdown.preferredSkillCoverage != null && Number.isFinite(Number(breakdown.preferredSkillCoverage)) ? Number(breakdown.preferredSkillCoverage) : null;
  const completeness = breakdown.resumeCompleteness != null && Number.isFinite(Number(breakdown.resumeCompleteness)) ? Number(breakdown.resumeCompleteness) : null;
  const matched = Array.isArray(analysis.matchingSkills) ? analysis.matchingSkills : [];
  const missing = Array.isArray(analysis.missingSkills) ? analysis.missingSkills : [];
  const recommended = Array.isArray(analysis.recommendations) ? analysis.recommendations : [];

  return <div className="resume-match-report">
    <section className="resume-score-card" aria-label="Resume match score">
      <div className="resume-score-ring" style={{ '--score-value': `${score ?? 0}%` }} role="img" aria-label={`ATS-style estimate ${score == null ? 'unavailable' : `${score}%`}`}>
        <div><strong>{score == null ? '—' : `${score}%`}</strong><small>match</small></div>
      </div>
      <div className="resume-score-copy"><span className="resume-eyebrow">ROLE MATCH REPORT</span><h4>ATS-style estimate</h4><p>{score == null ? 'This role does not include structured skills to calculate a match.' : 'A transparent estimate based on listed skills and resume sections.'}</p></div>
      <div className="resume-score-metrics">
        <ScoreMeter label="Required skills" value={required} detail={`${matched.length} found · ${missing.length} to review`} />
        <ScoreMeter label="Preferred skills" value={preferred} detail="Coverage of preferred role skills" />
        <ScoreMeter label="Resume sections" value={completeness} detail="Sections with content detected" />
      </div>
    </section>
    <section className="resume-gap-card">
      <div className="resume-report-section"><div className="resume-report-section-title"><span className="resume-skill-dot matched"/><h4>Skills found</h4><small>{matched.length}</small></div>{matched.length ? <div className="resume-gap-tags matched-tags">{matched.map((skill) => <span key={skill}>{skill}</span>)}</div> : <p>No required skills were detected in the available resume text.</p>}</div>
      <div className="resume-report-section"><div className="resume-report-section-title"><span className="resume-skill-dot missing"/><h4>Required gaps to review</h4><small>{missing.length}</small></div>{missing.length ? <><div className="resume-gap-tags">{missing.map((skill) => <span key={skill}>{skill}</span>)}</div><p className="resume-gap-guidance">Only add a skill if you can support it with real experience. Otherwise, treat it as a learning goal.</p></> : <p>No required gaps found in the available resume text. Verify matches manually.</p>}</div>
      <div className="resume-report-section"><h4>Recommended next steps</h4>{recommended.length ? <ul>{recommended.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Review each detected match and keep your resume details accurate.</p>}</div>
    </section>
  </div>;
}

function ResumeItemsEditor({ section, entries, onAdd, onChange, onRemove }) {
  const definition = itemDefinitions[section];
  return <div className="resume-step-content">
    <p className="resume-step-description">{definition.help}</p>
    {entries.length ? entries.map((entry, index) => <article className="resume-entry-card" key={`${section}-${index}`}>
      <div className="resume-entry-head"><strong>{definition.title} {index + 1}</strong><button type="button" className="resume-icon-button danger" onClick={() => onRemove(section, index)} aria-label={`Remove ${definition.title.toLowerCase()} ${index + 1}`}><FiTrash2 /></button></div>
      <div className="resume-fields-grid">{definition.fields.map(([field, label, kind]) => <TextField key={field} label={label} type={kind === 'month' ? 'month' : 'text'} multiline={kind === 'textarea'} maxLength={entryFieldLimits[field] || 500} value={entry[field]} onChange={(value) => onChange(section, index, field, value)} />)}</div>
    </article>) : <div className="resume-section-empty">{definition.empty}</div>}
    <button type="button" className="resume-add-button" onClick={() => onAdd(section)}><FiPlus /> Add {definition.title.toLowerCase()}</button>
  </div>;
}

export default function ResumesPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(() => createEmptyResume(user));
  const [activeStep, setActiveStep] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedAnalysisResume, setSelectedAnalysisResume] = useState('');
  const [selectedAnalysisJob, setSelectedAnalysisJob] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [review, setReview] = useState(null);
  const [extractedSource, setExtractedSource] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const importInputRef = useRef(null);

  const chooseImportFile = (file) => {
    if (!file) return false;
    if (!file.name.toLowerCase().endsWith('.pdf') || !acceptedPdfTypes.has(file.type || '')) {
      setImportFile(null); setError('CareerPilot imports PDF files only. Choose a .pdf file.'); setSuccess('');
      if (importInputRef.current) importInputRef.current.value = '';
      return false;
    }
    if (!file.size) {
      setImportFile(null); setError('This PDF is empty. Choose a different file.'); setSuccess('');
      if (importInputRef.current) importInputRef.current.value = '';
      return false;
    }
    if (file.size > MAX_IMPORT_SIZE) {
      setImportFile(null); setError('This PDF is larger than 8 MB. Choose a smaller file.'); setSuccess('');
      if (importInputRef.current) importInputRef.current.value = '';
      return false;
    }
    setError(''); setSuccess(''); setImportFile(file);
    return true;
  };

  const dropImportFile = (event) => {
    event.preventDefault();
    if (importing) return;
    const [file] = Array.from(event.dataTransfer?.files || []);
    if (!file) { setError('Drop one PDF file into the upload area.'); return; }
    chooseImportFile(file);
  };

  const loadResumes = useCallback(async () => {
    setError('');
    try {
      const response = await api.get('/resumes');
      setResumes(Array.isArray(response.data?.data?.resumes) ? response.data.data.resumes : []);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your resumes.');
      return false;
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/resumes'), api.get('/jobs').catch(() => null)])
      .then(([response, jobsResponse]) => {
        if (!active) return;
        const nextResumes = Array.isArray(response.data?.data?.resumes) ? response.data.data.resumes : [];
        const nextJobs = Array.isArray(jobsResponse?.data?.data?.jobs) ? jobsResponse.data.data.jobs : [];
        setResumes(nextResumes); setJobs(nextJobs);
        if (nextResumes.length) setSelectedAnalysisResume(String(nextResumes[0].id));
        if (nextJobs.length) setSelectedAnalysisJob(String(nextJobs[0].id));
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load your resumes.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const skills = useMemo(() => [...new Set(String(form.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean))], [form.skills]);
  const startNewResume = () => { setForm(createEmptyResume(user)); setSelectedId(null); setActiveStep(0); setExtractedSource(null); setHasUnsavedChanges(false); setError(''); setSuccess(''); };
  const updateField = (field, value) => { setHasUnsavedChanges(true); setForm((current) => ({ ...current, [field]: value })); };
  const updatePersonal = (field, value) => { setHasUnsavedChanges(true); setForm((current) => ({ ...current, personal_info: { ...current.personal_info, [field]: value } })); };
  const addItem = (section) => {
    if (form[section].length >= 30) { setError('Each resume section can include up to 30 entries.'); return; }
    setHasUnsavedChanges(true);
    setForm((current) => ({ ...current, [section]: [...current[section], {}] }));
  };
  const updateItem = (section, index, field, value) => { setHasUnsavedChanges(true); setForm((current) => ({ ...current, [section]: current[section].map((entry, itemIndex) => itemIndex === index ? { ...entry, [field]: value } : entry) })); };
  const removeItem = (section, index) => { setHasUnsavedChanges(true); setForm((current) => ({ ...current, [section]: current[section].filter((_, itemIndex) => itemIndex !== index) })); };

  const validateBasics = () => {
    if (!form.title.trim() || !form.personal_info.full_name?.trim() || !form.personal_info.email?.trim()) {
      setError('Add a resume title, your name, and a valid email before saving.');
      setActiveStep(0);
      return false;
    }
    if (form.title.trim().length > 150 || form.personal_info.full_name.trim().length > 120 || form.personal_info.email.trim().length > 255) {
      setError('One of the basic details is longer than the allowed limit.');
      setActiveStep(0);
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.personal_info.email.trim())) {
      setError('Enter a valid email address in your contact details.');
      setActiveStep(0);
      return false;
    }
    for (const field of ['linkedin', 'portfolio']) {
      if (!form.personal_info[field]) continue;
      try { if (!['http:', 'https:'].includes(new URL(form.personal_info[field]).protocol)) throw new Error(); }
      catch { setError(`${field === 'linkedin' ? 'LinkedIn profile' : 'Portfolio'} must be a full link starting with https://.`); setActiveStep(0); return false; }
    }
    if (skills.length > 50 || skills.some((skill) => skill.length > 100)) { setError('Keep the skills list to 50 items, with no skill longer than 100 characters.'); setActiveStep(4); return false; }
    return true;
  };

  const moveNext = () => {
    if (activeStep === 0) {
      if (!validateBasics()) return;
    }
    setError(''); setActiveStep((step) => Math.min(steps.length - 1, step + 1));
  };

  const saveResume = async () => {
    if (!validateBasics()) return;
    setSaving(true); setError(''); setSuccess('');
    const payload = { ...form, title: form.title.trim(), professional_summary: form.professional_summary.trim(), skills };
    try {
      const response = selectedId
        ? await api.put(`/resumes/${selectedId}`, payload)
        : await api.post('/resumes', payload);
      const savedResume = response.data?.data?.resume;
      if (!savedResume?.id) throw new Error('The saved resume was not returned.');
      const refreshed = await loadResumes();
      setSelectedId(savedResume.id);
      setForm(resumeToForm(savedResume, user));
      setHasUnsavedChanges(false);
      setActiveStep(steps.length - 1);
      setSelectedAnalysisResume(String(savedResume.id));
      setExtractedSource(savedResume.source_file_name ? { fileName: savedResume.source_file_name, text: savedResume.extracted_text || '' } : extractedSource);
      if (selectedAnalysisJob && !selectedId) {
        try {
          const matchResponse = await api.post('/matches/analyze', { resumeId: Number(savedResume.id), jobId: Number(selectedAnalysisJob) });
          const result = matchResponse.data?.data?.result || null;
          setAnalysis(result);
          setReview(null);
          if (result) setSuccess(`Resume saved and compared with your selected role. ATS-style estimate: ${result.atsScore ?? 'unavailable'}${result.atsScore == null ? '' : '%'}; ${result.missingSkills?.length || 0} required skill gap${result.missingSkills?.length === 1 ? '' : 's'} found.`);
        } catch (analysisError) {
          setError(`Your resume was saved, but role analysis could not finish: ${analysisError.response?.data?.message || 'try Analyze resume again below.'}`);
        }
      }
      if (!refreshed) setError('Your resume was saved, but the library could not refresh. Reload the page to see it.');
      else if (selectedId) setSuccess('Resume changes saved. The existing role analysis is unchanged; run Analyze resume to refresh it.');
      else if (!selectedAnalysisJob) setSuccess('Resume created and saved. Choose a target role above to calculate its ATS-style estimate and skill gaps.');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save your resume. Your changes are still here; try again.');
      return false;
    } finally { setSaving(false); }
  };

  const printResume = (resumeSaved = Boolean(selectedId)) => {
    if (!resumeSaved) { setError('Save this resume before downloading the PDF.'); return; }
    if (typeof window.print !== 'function') { setError('PDF download is not supported in this browser. Try a desktop browser with print support.'); return; }
    const previousTitle = document.title;
    const safeTitle = String(form.title || 'CareerPilot Resume').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 100);
    const clearPrintMode = () => { window.removeEventListener('afterprint', clearPrintMode); document.body.classList.remove('printing-resume'); document.title = previousTitle; setDownloading(false); };
    setError('');
    setSuccess('In the print dialog, choose “Save as PDF” to download your resume.');
    setDownloading(true);
    document.body.classList.add('printing-resume');
    document.title = `${safeTitle} - CareerPilot`;
    window.addEventListener('afterprint', clearPrintMode, { once: true });
    window.requestAnimationFrame(() => {
      try { window.print(); }
      catch { clearPrintMode(); setError('CareerPilot could not open the PDF dialog. Try again or use your browser’s Print menu.'); }
    });
  };

  const downloadResume = async () => {
    const saved = hasUnsavedChanges ? await saveResume() : Boolean(selectedId);
    if (!saved) return;
    printResume(true);
  };

  const editResume = async (resume) => {
    setError(''); setSuccess('');
    try {
      const response = await api.get(`/resumes/${resume.id}`);
      const fullResume = response.data?.data?.resume || resume;
      setForm(resumeToForm(fullResume, user));
      setHasUnsavedChanges(false);
      setExtractedSource(fullResume.source_file_name ? { fileName: fullResume.source_file_name, text: fullResume.extracted_text || '' } : null);
      setSelectedId(resume.id); setActiveStep(0);
      document.querySelector('.resume-builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) { setError(err.response?.data?.message || 'Unable to open this resume.'); }
  };

  const deleteResume = async (id) => {
    if (!window.confirm('Delete this resume? This action cannot be undone.')) return;
    setError(''); setSuccess('');
    try { await api.delete(`/resumes/${id}`); setResumes((current) => current.filter((resume) => resume.id !== id)); if (selectedId === id) startNewResume(); setSuccess('Resume deleted.'); }
    catch (err) { setError(err.response?.data?.message || 'Unable to delete this resume.'); }
  };

  const importExistingResume = async () => {
    if (!importFile) { setError('Choose a PDF resume before importing.'); return; }
    setImporting(true); setError(''); setSuccess('');
    try {
      const body = new FormData(); body.append('resume', importFile);
      const response = await api.post('/resumes/import', body);
      const imported = response.data?.data?.resume;
      if (!imported?.id) throw new Error('The imported resume was not returned.');
      setResumes((current) => [imported, ...current.filter((resume) => String(resume.id) !== String(imported.id))]);
      const resumeId = String(imported.id);
      const jobId = selectedAnalysisJob || (jobs[0] ? String(jobs[0].id) : '');
      setSelectedAnalysisResume(resumeId); setSelectedId(imported.id); setForm(resumeToForm(imported, user)); setActiveStep(0);
      setExtractedSource({ fileName: imported.source_file_name || importFile.name, text: imported.extracted_text || '' });
      setHasUnsavedChanges(false);
      setSuccess(response.data?.data?.note || 'PDF imported and saved to your resume library.');
      setImportFile(null);
      setAnalysis(null); setReview(null);
      if (importInputRef.current) importInputRef.current.value = '';
      if (jobId) {
        setSelectedAnalysisJob(jobId);
        try {
          const matchResponse = await api.post('/matches/analyze', { resumeId: Number(resumeId), jobId: Number(jobId) });
          const result = matchResponse.data?.data?.result || null;
          setAnalysis(result);
          if (result) {
            setSuccess(`Resume imported and saved. ATS-style estimate: ${result.atsScore ?? 'unavailable'}${result.atsScore == null ? '' : '%'}; ${result.missingSkills?.length || 0} required skill gap${result.missingSkills?.length === 1 ? '' : 's'} found for ${jobs.find((job) => String(job.id) === jobId)?.title || 'your selected role'}.`);
          }
        } catch (analysisError) {
          setError(`Your resume was imported and saved, but role analysis could not finish: ${analysisError.response?.data?.message || 'try Analyze resume again below.'}`);
        }
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setError(serverMessage === 'Choose a PDF file to import.'
        ? 'CareerPilot did not receive the selected PDF. Choose it again and retry; if it keeps happening, reload the page.'
        : serverMessage || err.message || 'Unable to import this PDF.');
    }
    finally { setImporting(false); }
  };

  const analyzeSelectedResume = async () => {
    if (!selectedAnalysisResume || !selectedAnalysisJob) { setError('Save a resume and a target role before analyzing fit.'); return; }
    setAnalyzing(true); setError(''); setReview(null);
    try {
      const response = await api.post('/matches/analyze', { resumeId: Number(selectedAnalysisResume), jobId: Number(selectedAnalysisJob) });
      setAnalysis(response.data?.data?.result || null);
    } catch (err) { setError(err.response?.data?.message || 'Unable to analyze this resume against the role.'); }
    finally { setAnalyzing(false); }
  };

  const getResumeReview = async () => {
    if (!selectedAnalysisResume || !selectedAnalysisJob) { setError('Choose a resume and a target role first.'); return; }
    setAnalyzing(true); setError(''); setReview(null);
    try {
      const response = await api.post('/ai/resume-review', { resumeId: Number(selectedAnalysisResume), jobId: Number(selectedAnalysisJob) });
      setAnalysis(response.data?.data?.match || analysis);
      setReview(response.data?.data?.review || null);
    } catch (err) { setError(err.response?.data?.message || 'Unable to generate resume suggestions.'); }
    finally { setAnalyzing(false); }
  };

  if (loading) return <div className="page-loading" role="status">Loading your resume workspace…</div>;

  const isEditing = Boolean(selectedId);
  return <div className="page-section resume-page">
    <header className="resume-page-heading"><div><span className="resume-eyebrow">CAREERPILOT RESUME WORKSPACE</span><h2>Improve your resume for a target role</h2><p>Import or build a resume, compare it with a real job description, close evidence-based skill gaps, then practice the interview.</p></div><span className="resume-library-count"><FiFileText /> {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'} saved</span></header>
    {error ? <div className="resume-alert error" role="alert">{error}</div> : null}{success ? <div className="resume-alert success" role="status"><span>{success}</span>{extractedSource ? <button type="button" onClick={() => document.querySelector('.resume-builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Review extracted fields <FiArrowRight /></button> : null}</div> : null}

    <section className="resume-workflow-guide" aria-label="Resume improvement workflow"><div><span>1</span><strong>Import or build</strong><small>Start with your existing work</small></div><div><span>2</span><strong>Compare to a role</strong><small>See keyword coverage and gaps</small></div><div><span>3</span><strong>Improve with evidence</strong><small>Review edits before saving</small></div><div><span>4</span><strong>Practice interview</strong><small>Use the same resume and role</small></div></section>

    <section className={`resume-import-panel${importFile ? ' has-file' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={dropImportFile}>
      <div className="resume-import-icon"><FiUpload /></div>
      <div className="resume-import-copy"><span className="resume-eyebrow">STEP 1 · START WITH YOUR EXISTING RESUME</span><h3>Import a PDF resume</h3><p>Choose or drop one PDF. CareerPilot extracts text into editable sections; then you can compare it with a saved role and review skill gaps. Scanned PDFs need OCR before import.</p><small id="resume-import-help">PDF only · up to 8 MB · searchable text required</small><p className="resume-import-privacy">The original PDF is not retained. Its filename and extracted text are saved in your workspace.</p></div>
      <div className="resume-import-controls">
        <label className="resume-import-file" title={importFile?.name || 'Choose a PDF resume'}><span className="resume-import-file-name">{importFile ? importFile.name : 'Choose a PDF file'}</span><input ref={importInputRef} type="file" accept="application/pdf,.pdf" aria-describedby="resume-import-help" onChange={(event) => chooseImportFile(event.target.files?.[0])} /></label>
        {importFile ? <button type="button" className="resume-import-clear" onClick={() => { setImportFile(null); if (importInputRef.current) importInputRef.current.value = ''; }}>Remove</button> : null}
        <button type="button" className="resume-primary-button" onClick={importExistingResume} disabled={!importFile || importing}>{importing ? 'Reading PDF…' : 'Import PDF'} <FiArrowRight /></button>
      </div>
    </section>

    <section className="resume-analysis-panel"><div className="resume-analysis-heading"><div><span className="resume-eyebrow">ROLE-SPECIFIC FIT</span><h3>ATS-style match and skill gaps</h3><p>This is an estimate from resume text and job requirements, not a score from an employer’s ATS or a hiring prediction.</p></div><FiTarget /></div>{resumes.length && jobs.length ? <><div className="resume-analysis-controls"><label>Resume<select value={selectedAnalysisResume} onChange={(event) => { setSelectedAnalysisResume(event.target.value); setAnalysis(null); setReview(null); }}><option value="">Choose a resume</option>{resumes.map((resume) => <option value={resume.id} key={resume.id}>{resume.title}</option>)}</select></label><label>Target role<select value={selectedAnalysisJob} onChange={(event) => { setSelectedAnalysisJob(event.target.value); setAnalysis(null); setReview(null); }}><option value="">Choose a role</option>{jobs.map((job) => <option value={job.id} key={job.id}>{job.title}{job.company ? ` · ${job.company}` : ''}</option>)}</select></label><button type="button" className="resume-primary-button" disabled={analyzing || !selectedAnalysisResume || !selectedAnalysisJob} onClick={analyzeSelectedResume}>{analyzing ? 'Analyzing…' : 'Analyze resume'} <FiTarget /></button></div><p className="resume-ai-disclosure">When live OpenAI is enabled, “Get improvement suggestions” sends the selected resume text and job description to OpenAI. Imported contact details are redacted where recognized; the original PDF is not sent.</p>{analysis ? <ResumeMatchReport analysis={analysis} /> : null}{review ? <div className="resume-ai-review"><header><FiZap /><div><h4>Resume improvement suggestions</h4><span className={`resume-ai-mode ${review.mode}`}>{review.mode === 'openai' ? 'OpenAI' : 'Rule-based guidance'}</span></div></header><p>{review.notice}</p><div className="resume-ai-review-content">{review.response}</div><small>Review suggestions carefully. Only use wording that is accurate to your real experience. <button type="button" onClick={() => { const item = resumes.find((resume) => String(resume.id) === selectedAnalysisResume); if (item) editResume(item); }}>Open this resume in the editor</button></small></div> : null}<div className="resume-analysis-actions"><button type="button" className="resume-secondary-button" onClick={getResumeReview} disabled={analyzing || !selectedAnalysisResume || !selectedAnalysisJob}>{analyzing ? 'Preparing suggestions…' : 'Get improvement suggestions'} <FiZap /></button><Link to={`/interviews?jobId=${selectedAnalysisJob}&resumeId=${selectedAnalysisResume}`}>Practice an interview for this role <FiActivity /></Link></div></> : <div className="resume-analysis-empty">{!resumes.length ? <><p>Save or import a resume to begin.</p><button type="button" onClick={() => document.querySelector('.resume-import-panel')?.scrollIntoView({ behavior: 'smooth' })}>Import a PDF</button></> : <><p>Add or save a job description to compare your resume against it.</p><Link to="/jobs">Go to roles</Link></>}</div>}</section>

    <section className="resume-builder" aria-label="Step-by-step resume builder">
      <div className="resume-builder-top"><div><span className="resume-eyebrow">{isEditing ? 'EDITING RESUME' : 'NEW RESUME'}</span><h3>{isEditing ? 'Update your resume' : 'Create your resume'}</h3></div>{isEditing ? <button type="button" className="resume-secondary-button" onClick={startNewResume}>Cancel edit</button> : null}</div>
      <nav className="resume-stepper" aria-label="Resume sections">{steps.map((step, index) => <button type="button" className={`resume-step${activeStep === index ? ' active' : ''}${activeStep > index ? ' complete' : ''}`} onClick={() => { setActiveStep(index); setError(''); }} aria-current={activeStep === index ? 'step' : undefined} key={step}><span className="resume-step-number">{activeStep > index ? <FiCheck /> : index + 1}</span><span className="resume-step-label">{step}</span></button>)}</nav>
      <div className="resume-builder-body">
        {extractedSource ? <details className="resume-extracted-source"><summary>View text extracted from {extractedSource.fileName}</summary><pre>{extractedSource.text || 'No extracted text was saved.'}</pre><small>Use this to verify that section parsing did not omit or misread details.</small></details> : null}
        <form className="resume-editor" onSubmit={(event) => { event.preventDefault(); if (activeStep === steps.length - 1) saveResume(); else moveNext(); }}>
          {activeStep === 0 ? <div className="resume-step-content"><p className="resume-step-description">Start with your contact details. Your account name and email are filled in to save time; you can edit them for this resume.</p><div className="resume-fields-grid"><TextField label="Resume title" maxLength={150} value={form.title} onChange={(value) => updateField('title', value)} required /><TextField label="Full name" maxLength={120} value={form.personal_info.full_name} onChange={(value) => updatePersonal('full_name', value)} required /><TextField label="Email address" maxLength={255} type="email" value={form.personal_info.email} onChange={(value) => updatePersonal('email', value)} required /><TextField label="Phone" maxLength={30} type="tel" value={form.personal_info.phone} onChange={(value) => updatePersonal('phone', value)} /><TextField label="Location" maxLength={160} value={form.personal_info.location} onChange={(value) => updatePersonal('location', value)} /><TextField label="LinkedIn profile" maxLength={500} type="url" value={form.personal_info.linkedin} onChange={(value) => updatePersonal('linkedin', value)} /><TextField label="Portfolio or website" maxLength={500} type="url" value={form.personal_info.portfolio} onChange={(value) => updatePersonal('portfolio', value)} /></div></div> : null}
          {activeStep === 1 ? <div className="resume-step-content"><p className="resume-step-description">Write a short, specific introduction that explains your experience and the kind of work you do.</p><TextField label="Professional summary" multiline value={form.professional_summary} onChange={(value) => updateField('professional_summary', value)} /><small className="resume-field-hint">Keep it factual and use your own words. Avoid personal information you do not want to share with employers.</small></div> : null}
          {activeStep === 2 || activeStep === 3 || activeStep === 5 || activeStep === 6 ? <ResumeItemsEditor section={{ 2: 'experience', 3: 'education', 5: 'projects', 6: 'certifications' }[activeStep]} entries={form[ { 2: 'experience', 3: 'education', 5: 'projects', 6: 'certifications' }[activeStep] ]} onAdd={addItem} onChange={updateItem} onRemove={removeItem} /> : null}
          {activeStep === 4 ? <div className="resume-step-content"><p className="resume-step-description">List relevant skills, separated by commas. The saved list is normalized and duplicates are removed.</p><TextField label="Skills" multiline value={form.skills} onChange={(value) => updateField('skills', value)} /><div className="resume-skill-preview" aria-live="polite">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div> : null}
          {activeStep === 7 ? <div className="resume-review">
             <div className="resume-preview-toolbar"><div><span className="resume-eyebrow">PREVIEW RESUME</span><p>Review your saved resume, then download a print-ready PDF.</p></div><button type="button" className="resume-secondary-button resume-download-button" onClick={downloadResume} disabled={saving || downloading}>{downloading ? 'Preparing PDF…' : <><FiDownload /> Download Resume (PDF)</>}</button></div>
             <div className="resume-review-paper">
               <div className="resume-review-head"><div><h4>{form.personal_info.full_name || 'Your name'}</h4><p className="resume-document-title">{form.title}</p><p className="resume-review-contact">{form.personal_info.email ? <a href={`mailto:${encodeURIComponent(form.personal_info.email)}`}>{form.personal_info.email}</a> : null}{form.personal_info.phone ? <a href={`tel:${form.personal_info.phone.replace(/[^+\d]/g, '')}`}>{form.personal_info.phone}</a> : null}{form.personal_info.location ? <span>{form.personal_info.location}</span> : null}</p><div className="resume-review-links">{safeResumeLink(form.personal_info.linkedin) ? <a href={safeResumeLink(form.personal_info.linkedin)} target="_blank" rel="noreferrer">LinkedIn</a> : null}{safeResumeLink(form.personal_info.portfolio) ? <a href={safeResumeLink(form.personal_info.portfolio)} target="_blank" rel="noreferrer">Portfolio</a> : null}</div></div></div>
               {form.professional_summary ? <section><h5>Professional summary</h5><p>{form.professional_summary}</p></section> : null}
               {form.experience.length ? <section><h5>Experience</h5>{form.experience.map((item, index) => <article key={index}><h6>{item.title || 'Role'}{item.company ? ' · ' + item.company : ''}</h6><small>{[item.location, item.start_date, item.end_date].filter(Boolean).join(' · ')}</small>{item.description ? <p>{item.description}</p> : null}</article>)}</section> : null}
               {form.education.length ? <section><h5>Education</h5>{form.education.map((item, index) => <article key={index}><h6>{item.degree || 'Education'}{item.institution ? ' · ' + item.institution : ''}</h6><small>{[item.location, item.start_date, item.end_date].filter(Boolean).join(' · ')}</small>{item.details ? <p>{item.details}</p> : null}</article>)}</section> : null}
               {skills.length ? <section><h5>Skills</h5><p>{skills.join(' · ')}</p></section> : null}
               {form.projects.length ? <section><h5>Projects</h5>{form.projects.map((item, index) => <article key={index}><h6>{item.name || 'Project'}{item.technologies ? ' · ' + item.technologies : ''}</h6>{item.description ? <p>{item.description}</p> : null}{safeResumeLink(item.link) ? <a className="resume-pdf-link" href={safeResumeLink(item.link)} target="_blank" rel="noreferrer">{item.link}</a> : null}</article>)}</section> : null}
               {form.certifications.length ? <section><h5>Certifications</h5>{form.certifications.map((item, index) => <article key={index}><h6>{item.name || 'Certification'}{item.issuer ? ' · ' + item.issuer : ''}</h6>{item.issue_date ? <small>{item.issue_date}</small> : null}{safeResumeLink(item.credential_url) ? <p><a className="resume-pdf-link" href={safeResumeLink(item.credential_url)} target="_blank" rel="noreferrer">View credential</a></p> : null}</article>)}</section> : null}
             </div>
             <p className="resume-review-note">Review the details above. Go back to any step to make edits. Downloading opens your browser’s PDF dialog so the saved resume text and links remain selectable.</p>
           </div> : null}
          <div className="resume-step-actions">{activeStep > 0 ? <button type="button" className="resume-secondary-button" onClick={() => { setActiveStep((step) => step - 1); setError(''); }}><FiArrowLeft /> Back</button> : <span />}{activeStep < steps.length - 1 ? <button type="submit" className="resume-primary-button">Continue <FiArrowRight /></button> : <button type="submit" className="resume-primary-button" disabled={saving || (isEditing && !hasUnsavedChanges)}>{saving ? 'Saving…' : isEditing && !hasUnsavedChanges ? 'Saved' : isEditing ? 'Save changes' : 'Save resume'} <FiCheck /></button>}</div>
        </form>
        <aside className="resume-builder-aside"><span className="resume-aside-icon"><FiFileText /></span><h4>One section at a time</h4><p>{isEditing ? <>This resume is already in your library. Your edits are saved when you choose <strong>Save changes</strong>.</> : <>Your new resume stays in draft while you work. It is saved when you choose <strong>Save resume</strong>.</>}</p><div className="resume-aside-progress"><span>Progress</span><strong>{Math.round((activeStep + 1) / steps.length * 100)}%</strong><div><span style={{ width: `${(activeStep + 1) / steps.length * 100}%` }} /></div></div><small>Only enter details you want included in this resume.</small></aside>
      </div>
    </section>

    <section className="resume-library"><div className="resume-library-heading"><div><span className="resume-eyebrow">YOUR SAVED WORK</span><h3>Resume library</h3></div></div>{resumes.length ? <div className="resume-library-grid">{resumes.map((resume) => { const resumeSkills = parseJson(resume.skills, []); return <article className="resume-library-card" key={resume.id}><div className="resume-library-card-icon"><FiFileText /></div><div className="resume-library-card-content"><h4>{resume.title}</h4><p>{resume.professional_summary || 'No professional summary yet.'}</p><div className="resume-card-skills">{(Array.isArray(resumeSkills) ? resumeSkills : []).slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}</div><small>Last updated {formatUpdatedAt(resume.updated_at)}</small></div><div className="resume-library-actions"><Link className="resume-practice-link" to={`/interviews?resumeId=${resume.id}`}><FiActivity /> Practice</Link><button type="button" onClick={() => editResume(resume)}>Edit</button><button type="button" className="resume-delete-button" onClick={() => deleteResume(resume.id)} aria-label={`Delete ${resume.title}`}><FiTrash2 /></button></div></article>; })}</div> : <div className="resume-library-empty"><FiFileText /><strong>Your library is ready</strong><span>Your saved resumes will appear here after you complete the steps and save one.</span></div>}</section>
  </div>;
}
