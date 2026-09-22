import { useEffect, useState } from 'react';
import api from '../services/api';

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="page-loading">Loading skill insights...</div>;
  }

  return (
    <div className="page-section">
      <div className="panel-card">
        <div className="panel-header">
          <h3>Skill gaps and learning priorities</h3>
        </div>

        {skills.length ? (
          <div className="row g-3">
            {skills.map((skill) => (
              <div key={`${skill.skill_name}-${skill.priority}`} className="col-md-6">
                <div className="skill-card">
                  <div className="skill-head">
                    <strong>{skill.skill_name}</strong>
                    <span className="badge bg-warning-subtle text-warning-emphasis">{skill.priority || 'Medium'}</span>
                  </div>
                  <p><strong>Current level:</strong> {skill.current_level || 'Beginner'}</p>
                  <p><strong>Target level:</strong> {skill.missing_level || 'Intermediate'}</p>
                  <div>
                    <strong>Recommended topics:</strong>
                    <ul>
                      {(skill.recommended_topics || []).map((topic) => (
                        <li key={topic}>{topic}</li>
                      ))}
                    </ul>
                  </div>
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
