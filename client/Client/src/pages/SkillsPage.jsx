import { useEffect, useState } from 'react';
import api from '../services/api';

const parseTopics = (value) => {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [String(value)];
  } catch {
    return String(value || '').split(',').map((topic) => topic.trim()).filter(Boolean);
  }
};

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(() => JSON.parse(localStorage.getItem('careerpilot_learning_progress') || '{}'));

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await api.get('/skills/gaps');
        setSkills(response.data.data.skills || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, []);

  const toggleTopic = (skillName, topic) => {
    const key = `${skillName}:${topic}`;
    setCompleted((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem('careerpilot_learning_progress', JSON.stringify(next));
      return next;
    });
  };

  if (loading) {
    return <div className="page-loading">Loading skill insights...</div>;
  }

  return (
    <div className="page-section">
      <div className="page-heading"><div><div className="eyebrow">Your next growth sprint</div><h2>Skills and learning</h2><p>Turn every gap into a practical plan with focused steps and visible progress.</p></div><span className="result-count">{skills.length} priorities</span></div>
      <div className="learning-summary panel-card"><strong>Learning plan</strong><span>Complete the suggested steps and revisit your job matches as your skills grow.</span></div>
      <div className="panel-card">

        {skills.length ? (
          <div className="row g-3">
            {skills.map((skill) => (
              <div key={`${skill.skill_name}-${skill.priority}`} className="col-md-6">
                <div className="skill-card">
                  <div className="skill-head">
                    <strong>{skill.skill_name}</strong>
                    <span className="badge bg-warning-subtle text-warning-emphasis">{skill.priority || 'Medium'}</span>
                  </div>
                  <div className="skill-meta"><span>{skill.current_level || 'Beginner'} → {skill.missing_level || 'Intermediate'}</span><span>{skill.estimated_hours || 10} hrs</span></div>
                  <div className="learning-steps">
                    {parseTopics(skill.recommended_topics).map((topic) => {
                      const key = `${skill.skill_name}:${topic}`;
                      return <label key={topic} className={completed[key] ? 'done' : ''}><input type="checkbox" checked={Boolean(completed[key])} onChange={() => toggleTopic(skill.skill_name, topic)} />{topic}</label>;
                    })}
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-primary mt-3" onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill.skill_name} tutorial`)}`, '_blank', 'noopener,noreferrer')}>Find learning resources</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-empty">No skill gap insights available yet.</p>
        )}
      </div>
    </div>
  );
}
