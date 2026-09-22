import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyForm = {
  title: '',
  professional_summary: '',
  skills: '',
};

const parseSkillText = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  return String(skills)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
    loadResumes();
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        skills: parseSkillText(form.skills),
      };

      if (isEditing && selectedId) {
        await api.put(`/resumes/${selectedId}`, payload);
      } else {
        await api.post('/resumes', payload);
      }

      setForm(emptyForm);
      setIsEditing(false);
      setSelectedId(null);
      await loadResumes();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save resume.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (resume) => {
    setForm({
      title: resume.title || '',
      professional_summary: resume.professional_summary || '',
      skills: parseSkillText(resume.skills || []).join(', '),
    });
    setSelectedId(resume.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/resumes/${id}`);
      await loadResumes();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete resume.');
    }
  };

  if (loading) {
    return <div className="page-loading">Loading resumes...</div>;
  }

  return (
    <div className="page-section">
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="panel-card">
            <div className="panel-header">
              <h3>{isEditing ? 'Edit resume' : 'Add resume'}</h3>
            </div>

            {error ? <div className="alert alert-danger">{error}</div> : null}

            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-12">
                <label className="form-label">Resume title</label>
                <input className="form-control" name="title" value={form.title} onChange={handleChange} required />
              </div>

              <div className="col-md-12">
                <label className="form-label">Professional summary</label>
                <textarea className="form-control" name="professional_summary" value={form.professional_summary} onChange={handleChange} rows={5} />
              </div>

              <div className="col-md-12">
                <label className="form-label">Skills</label>
                <input className="form-control" name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node.js, SQL" />
              </div>

              <div className="col-md-12 d-flex justify-content-between">
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setForm(emptyForm); setIsEditing(false); setSelectedId(null); }}>
                  Clear
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : isEditing ? 'Update resume' : 'Create resume'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="panel-card">
            <div className="panel-header">
              <h3>Saved resumes</h3>
            </div>

            {resumes.length ? (
              <div className="stack-list">
                {resumes.map((resume) => (
                  <div key={resume.id} className="stack-item aligned-start">
                    <div>
                      <strong>{resume.title}</strong>
                      <div className="text-muted small">
                        {parseSkillText(resume.skills || []).join(', ') || 'No skill list yet'}
                      </div>
                      <div className="text-muted small mt-1">
                        {resume.professional_summary ? resume.professional_summary.slice(0, 120) : 'No summary added'}
                      </div>
                    </div>
                    <div className="inline-actions">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(resume)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(resume.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-empty">No resumes created yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
