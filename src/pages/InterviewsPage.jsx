import { useEffect, useState } from "react";
import {
  FiArrowRight,
  FiBriefcase,
  FiClock,
  FiFileText,
  FiMessageCircle,
  FiPlus,
  FiTarget,
} from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import "../styles/interviews.scss";

const initialForm = { type: "technical", title: "", job_id: "", resume_id: "" };
const typeLabels = {
  technical: "Technical",
  behavioral: "Behavioral",
  hr: "HR",
  mixed: "Mixed practice",
};

export default function InterviewsPage() {
  const [searchParams] = useSearchParams();
  const requestedJobId = searchParams.get("jobId") || "";
  const requestedResumeId = searchParams.get("resumeId") || "";
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [form, setForm] = useState(() => ({
    ...initialForm,
    job_id: requestedJobId,
    resume_id: requestedResumeId,
  }));
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    Promise.all([
      api.get("/jobs", { signal: controller.signal }),
      api.get("/resumes", { signal: controller.signal }),
    ])
      .then(([jobResponse, resumeResponse]) => {
        if (!active) return;
        const availableResumes = resumeResponse.data?.data?.resumes || [];
        setJobs(jobResponse.data?.data?.jobs || []);
        setResumes(availableResumes);
        setForm((current) => ({
          ...current,
          resume_id: current.resume_id || requestedResumeId || String(availableResumes[0]?.id || ""),
        }));
      })
      .catch((err) => {
        if (active && !controller.signal.aborted)
          setError(
            err.response?.data?.message ||
              "Unable to load your interview workspace.",
          );
      })
      .finally(() => {
        if (active) setLookupsLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [requestedResumeId]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    api.get("/interviews", { params: { page, limit: 20 }, signal: controller.signal })
      .then((response) => {
        if (!active) return;
        const data = response.data?.data || {};
        setSessions(data.interviews || []);
        setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 });
      })
      .catch((err) => {
        if (active && !controller.signal.aborted)
          setError(err.response?.data?.message || "Unable to load your interview workspace.");
      })
      .finally(() => {
        if (active) {
          setSessionsLoading(false);
          setPageLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [page]);

  const goToPage = (nextPage) => {
    setPageLoading(true);
    setPage(nextPage);
  };

  const createSession = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await api.post("/interviews", {
        ...form,
        job_id: form.job_id ? Number(form.job_id) : null,
        resume_id: form.resume_id ? Number(form.resume_id) : null,
      });
      const created = response.data?.data?.interview;
      if (created?.id) {
        navigate(`/interviews/${created.id}`);
        return;
      }
      setForm(initialForm);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create this practice session.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (lookupsLoading || (sessionsLoading && !sessions.length))
    return (
      <div className="page-loading" role="status">
        Loading interview practice…
      </div>
    );
  return (
    <div className="page-section interview-workspace">
      <section className="interview-welcome">
        <div className="interview-welcome-copy">
          <span className="eyebrow">PRACTICE WITH PURPOSE</span>
          <h2>Make the next interview feel familiar.</h2>
          <p>
            Choose a role, use your resume as context, and practice with
            relevant questions and feedback. Live AI can add deeper coaching
            when configured; local practice remains available without it.
          </p>
          <div className="interview-welcome-links">
            <Link to="/jobs">
              <FiBriefcase /> Find a role
            </Link>
            <Link to="/resumes">
              <FiFileText /> Update a resume
            </Link>
            <span>
              <FiMessageCircle /> Career assistant is available in the corner
            </span>
          </div>
        </div>
        <div className="interview-welcome-art" aria-hidden="true">
          <div className="interview-art-ring">
            <FiMessageCircle />
            <span>Practice</span>
          </div>
          <div className="interview-art-note note-one">
            Tell me about a challenge you solved.
          </div>
          <div className="interview-art-note note-two">
            Take a moment to think.
          </div>
        </div>
      </section>
      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}
      <div className="interview-content-grid">
        <section className="panel-card interview-create-card">
          <div className="interview-section-title">
            <span className="interview-icon">
              <FiPlus />
            </span>
            <div>
              <span className="eyebrow">NEW PRACTICE</span>
              <h3>Set up a session</h3>
              <p>
                We analyze your resume first, then tailor the questions to your evidence and experience.
              </p>
            </div>
          </div>
          <form onSubmit={createSession} className="interview-form">
            <label htmlFor="practice-type">
              Practice focus
              <select
                id="practice-type"
                value={form.type}
                onChange={(e) =>
                  setForm((current) => ({ ...current, type: e.target.value }))
                }
              >
                <option value="technical">Technical interview</option>
                <option value="behavioral">Behavioral interview</option>
                <option value="hr">HR / introductory</option>
                <option value="mixed">Mixed practice</option>
              </select>
            </label>
            <label htmlFor="practice-job">
              Role context <span>Optional</span>
              <select
                id="practice-job"
                value={form.job_id}
                onChange={(e) =>
                  setForm((current) => ({ ...current, job_id: e.target.value }))
                }
              >
                <option value="">General practice</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                    {job.company ? ` · ${job.company}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="practice-resume">
              Resume for question generation <span>Required</span>
              <select
                id="practice-resume"
                value={form.resume_id}
                required
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    resume_id: e.target.value,
                  }))
                }
              >
                <option value="">Choose the resume to analyze</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.title}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="practice-title">
              Session name <span>Optional</span>
              <input
                id="practice-title"
                maxLength={150}
                value={form.title}
                onChange={(e) =>
                  setForm((current) => ({ ...current, title: e.target.value }))
                }
                placeholder="e.g. Product designer · first round"
              />
            </label>
            <button
              type="submit"
              className="interview-primary-button"
              disabled={saving || !resumes.length || !form.resume_id}
            >
              {saving ? "Creating session…" : "Create practice session"}{" "}
              <FiArrowRight />
            </button>
            {!resumes.length ? (
              <p className="interview-form-hint">
                <Link to="/resumes">Create or import a resume</Link> before starting; questions are generated from your actual experience and skills.
              </p>
            ) : null}
          </form>
        </section>
        <section className="interview-session-section">
          <div className="interview-list-heading">
            <div>
              <span className="eyebrow">YOUR PREPARATION</span>
              <h3>Practice sessions</h3>
            </div>
            <span className="interview-count">
              {pagination.total} {pagination.total === 1 ? "session" : "sessions"}
            </span>
          </div>
          {pageLoading && sessions.length ? <p className="application-page-status" role="status">Loading page {page}…</p> : null}
          {sessions.length ? (
            <div className="interview-session-list">
              {sessions.map((session) => (
                <article className="interview-session-card" key={session.id}>
                  <div className="session-type-mark">
                    <FiMessageCircle />
                  </div>
                  <div className="session-card-body">
                    <div className="session-card-title-row">
                      <h4>
                        {session.title ||
                          typeLabels[session.type] ||
                          "Interview practice"}
                      </h4>
                      <span className={`session-status ${session.status}`}>
                        {session.status || "active"}
                      </span>
                    </div>
                    <p>
                      {typeLabels[session.type] || session.type} practice
                      {session.job_title
                        ? ` · ${session.job_title}${session.job_company ? ` at ${session.job_company}` : ""}`
                        : " · General role practice"}
                    </p>
                    <div className="session-meta">
                      <span>
                        <FiTarget /> {session.answer_count || 0}/
                        {session.question_count || 0} answers
                      </span>
                      {session.resume_title ? (
                        <span>
                          <FiFileText /> {session.resume_title}
                        </span>
                      ) : (
                        <span>
                          <FiClock />{" "}
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    className="session-open-link"
                    to={`/interviews/${session.id}`}
                    aria-label={`Open ${session.title || "practice session"}`}
                  >
                    <FiArrowRight />
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="interview-empty panel-card">
              <span className="interview-empty-icon">
                <FiMessageCircle />
              </span>
              <h4>Your practice history starts here</h4>
              <p>
                Create a session to get role-aware questions, record your
                answers, and review AI feedback.
              </p>
              <a href="#practice-type">
                Set up your first session <FiArrowRight />
              </a>
            </div>
          )}
          {pagination.totalPages > 1 ? <nav className="list-pagination" aria-label="Interview session pages"><button type="button" onClick={() => goToPage(Math.max(1, page - 1))} disabled={pageLoading || page <= 1}>Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button type="button" onClick={() => goToPage(Math.min(pagination.totalPages, page + 1))} disabled={pageLoading || page >= pagination.totalPages}>Next</button></nav> : null}
        </section>
      </div>
      <p className="interview-privacy-note">
        AI generated questions and feedback are practice guidance. Review them
        alongside the actual employer posting and your own experience.
      </p>
    </div>
  );
}
