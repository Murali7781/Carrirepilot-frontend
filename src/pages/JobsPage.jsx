import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPlus, FiSearch, FiSliders } from "react-icons/fi";
import JobCard from "../components/jobs/JobCard";
import "../styles/jobs.scss";
import {
  applyToJob,
  createJob,
  getJobs,
  searchLiveJobs,
  saveJob,
  unsaveJob,
} from "../services/jobsService";

const emptyRole = {
  title: "",
  company: "",
  location: "",
  source_url: "",
  description: "",
  experience_requirements: "",
  required_skills: "",
  preferred_skills: "",
};
const splitSkills = (value) =>
  String(value || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
const getSavedJobState = (items) => ({
  ids: items.filter((job) => job.saved_job_id).map((job) => String(job.id)),
  records: Object.fromEntries(items.filter((job) => job.saved_job_id).map((job) => [String(job.id), job.saved_job_id])),
});

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState([]);
  const [savedJobRecords, setSavedJobRecords] = useState({});
  const [applicationsByJob, setApplicationsByJob] = useState({});
  const [applyingId, setApplyingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [sort, setSort] = useState("recent");
  const [sourceMode, setSourceMode] = useState("workspace");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("in");
  const [livePage, setLivePage] = useState(1);
  const [liveTotal, setLiveTotal] = useState(0);
  const [liveLoading, setLiveLoading] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleForm, setRoleForm] = useState(emptyRole);
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    let active = true;
    getJobs()
      .then((jobList) => {
        if (!active) return;
        setJobs(Array.isArray(jobList) ? jobList : []);
        const savedState = getSavedJobState(jobList);
        setSavedIds(savedState.ids);
        setSavedJobRecords(savedState.records);
        setApplicationsByJob(
          Object.fromEntries(
            jobList.filter((job) => job.application_id).map((job) => [
              String(job.id),
              { id: job.application_id, job_id: job.id, status: job.application_status },
            ]),
          ),
        );
      })
      .catch((error) => {
        if (active)
          setNotice(
            error.response?.data?.message ||
              "Unable to load roles. Please try again.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const results = query
      ? jobs.filter((job) =>
          `${job.title} ${job.company || ""} ${job.location || ""} ${job.description || ""}`
            .toLowerCase()
            .includes(query),
        )
      : [...jobs];
    return results.sort((a, b) =>
      sort === "title"
        ? String(a.title).localeCompare(String(b.title))
        : new Date(b.created_at || 0) - new Date(a.created_at || 0),
    );
  }, [jobs, search, sort]);

  const loadLiveJobs = async ({ page = 1 } = {}) => {
    setLiveLoading(true);
    setNotice("");
    try {
      const result = await searchLiveJobs({ search: search.trim(), location: location.trim(), country, page });
      const liveJobs = Array.isArray(result.jobs) ? result.jobs : [];
      const savedState = getSavedJobState(liveJobs);
      setJobs(liveJobs);
      setSavedIds(savedState.ids);
      setSavedJobRecords(savedState.records);
      setLivePage(result.pagination?.page || page);
      setLiveTotal(Number(result.pagination?.total) || 0);
      setSourceMode("live");
    } catch (error) {
      setJobs([]);
      setLiveTotal(0);
      setNotice(error.response?.data?.message || "Live job search is unavailable. Please try again later.");
    } finally {
      setLiveLoading(false);
    }
  };

  const switchSource = async (mode) => {
    if (mode === sourceMode) return;
    setSourceMode(mode);
    setNotice("");
    if (mode === "live") {
      await loadLiveJobs({ page: 1 });
      return;
    }
    setLoading(true);
    try {
      const workspaceJobs = await getJobs();
      const savedState = getSavedJobState(workspaceJobs);
      setJobs(workspaceJobs);
      setSavedIds(savedState.ids);
      setSavedJobRecords(savedState.records);
    } catch (error) {
      setNotice(error.response?.data?.message || "Unable to load your workspace roles.");
    } finally {
      setLoading(false);
    }
  };

  const searchRoles = (event) => {
    event.preventDefault();
    if (sourceMode === "live") loadLiveJobs({ page: 1 });
  };

  const handleSave = async (job) => {
    const isSaved = savedIds.includes(String(job.id));
    try {
      if (isSaved) {
        await unsaveJob(job.id, savedJobRecords[String(job.id)]);
        setSavedJobRecords((current) => {
          const next = { ...current };
          delete next[String(job.id)];
          return next;
        });
      } else {
        const savedJob = await saveJob(job.id);
        if (savedJob.id)
          setSavedJobRecords((current) => ({
            ...current,
            [String(job.id)]: savedJob.id,
          }));
      }
      setSavedIds((current) =>
        isSaved
          ? current.filter((id) => id !== String(job.id))
          : [...current, String(job.id)],
      );
      setNotice(
        isSaved
          ? "Role removed from your saved list."
          : "Role saved to your shortlist.",
      );
    } catch (error) {
      setNotice(
        error.response?.data?.message || "Unable to update saved roles.",
      );
    }
  };

  const handleMarkApplied = async (job) => {
    const existing = applicationsByJob[String(job.id)];
    if (existing) {
      setNotice(`This role is already tracked as ${existing.status}.`);
      return;
    }
    setApplyingId(job.id);
    setNotice("");
    try {
      const response = await applyToJob(job.id);
      const application = response.data?.data?.application;
      if (application)
        setApplicationsByJob((current) => ({
          ...current,
          [String(job.id)]: application,
        }));
      setNotice(
        `“${job.title}” was added to your application tracker as applied. This does not submit anything to the employer.`,
      );
    } catch (error) {
      setNotice(
        error.response?.data?.message ||
          "Unable to update your application tracker.",
      );
    } finally {
      setApplyingId(null);
    }
  };

  const handleCreateRole = async (event) => {
    event.preventDefault();
    setSavingRole(true);
    setNotice("");
    try {
      const job = await createJob({
        ...roleForm,
        title: roleForm.title.trim(),
        company: roleForm.company.trim(),
        location: roleForm.location.trim(),
        description: roleForm.description.trim(),
        required_skills: splitSkills(roleForm.required_skills),
        preferred_skills: splitSkills(roleForm.preferred_skills),
      });
      setJobs((current) => [job, ...current]);
      setRoleForm(emptyRole);
      setShowRoleForm(false);
      setNotice(
        "Role added to your workspace. CareerPilot has not applied to it for you.",
      );
    } catch (error) {
      setNotice(
        error.response?.data?.message ||
          "Unable to add this role. Check the required fields and try again.",
      );
    } finally {
      setSavingRole(false);
    }
  };

  if (loading)
    return (
      <div className="page-loading" role="status">
        Loading your roles…
      </div>
    );

  return (
    <div className="page-section">
      <div className="page-heading jobs-heading">
        <div>
          <div className="eyebrow">Your job workspace</div>
          <h2>Find and track roles</h2>
          <p>
            Search live listings, save opportunities, compare them with your resume,
            and keep your application pipeline organized.
          </p>
        </div>
        {sourceMode === "workspace" ? <div className="job-workspace-actions"><button
          type="button"
          className="btn btn-primary add-role-trigger"
          onClick={() => {
            setShowRoleForm((open) => !open);
            setNotice("");
          }}
        >
          <FiPlus /> {showRoleForm ? "Close form" : "Add a role"}
        </button></div> : null}
      </div>
      {notice ? (
        <div className="alert alert-info" role="status">
          {notice}
        </div>
      ) : null}
      {showRoleForm ? (
        <section className="panel-card add-role-panel">
          <div className="panel-header">
            <div>
              <h3>Add a job posting</h3>
              <p className="text-muted mb-0">
                Paste details from the employer’s listing. This role is private
                to your workspace.
              </p>
            </div>
          </div>
          <form onSubmit={handleCreateRole} className="add-role-form">
            <label>
              Job title
              <input
                name="title"
                maxLength={150}
                value={roleForm.title}
                onChange={(event) =>
                  setRoleForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              Company
              <input
                name="company"
                maxLength={150}
                value={roleForm.company}
                onChange={(event) =>
                  setRoleForm((current) => ({
                    ...current,
                    company: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Location
              <input
                name="location"
                maxLength={200}
                value={roleForm.location}
                onChange={(event) =>
                  setRoleForm((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Job posting URL
              <input
                name="source_url"
                type="url"
                maxLength={2048}
                value={roleForm.source_url}
                onChange={(event) =>
                  setRoleForm((current) => ({
                    ...current,
                    source_url: event.target.value,
                  }))
                }
              />
            </label>
            <label className="add-role-wide">
              Job description
              <textarea
                name="description"
                maxLength={15000}
                rows={5}
                value={roleForm.description}
                onChange={(event) =>
                  setRoleForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              Experience requirements
              <input
                name="experience_requirements"
                maxLength={1000}
                value={roleForm.experience_requirements}
                onChange={(event) =>
                  setRoleForm((current) => ({
                    ...current,
                    experience_requirements: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Required skills
              <input
                name="required_skills"
                maxLength={3000}
                value={roleForm.required_skills}
                onChange={(event) =>
                  setRoleForm((current) => ({
                    ...current,
                    required_skills: event.target.value,
                  }))
                }
              />
            </label>
            <label className="add-role-wide">
              Preferred skills
              <input
                name="preferred_skills"
                maxLength={3000}
                value={roleForm.preferred_skills}
                onChange={(event) =>
                  setRoleForm((current) => ({
                    ...current,
                    preferred_skills: event.target.value,
                  }))
                }
              />
            </label>
            <div className="add-role-actions">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => {
                  setShowRoleForm(false);
                  setRoleForm(emptyRole);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingRole}
              >
                {savingRole ? "Saving…" : "Save role"}
              </button>
            </div>
          </form>
        </section>
      ) : null}
      <div className="panel-card job-search-panel">
        <div className="job-source-tabs" role="tablist" aria-label="Job listing source">
          <button type="button" role="tab" aria-selected={sourceMode === "live"} className={sourceMode === "live" ? "active" : ""} onClick={() => switchSource("live")}>Live jobs</button>
          <button type="button" role="tab" aria-selected={sourceMode === "workspace"} className={sourceMode === "workspace" ? "active" : ""} onClick={() => switchSource("workspace")}>My roles</button>
        </div>
        <form className="job-search-row" onSubmit={searchRoles}>
          <div className="search-field">
            <FiSearch />
            <input
              aria-label="Search job titles and keywords"
              placeholder={sourceMode === "live" ? "Job title or keyword" : "Search your roles"}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {sourceMode === "live" ? <>
            <input className="job-location-input" aria-label="Location" placeholder="City or region" maxLength={100} value={location} onChange={(event) => setLocation(event.target.value)} />
            <select aria-label="Country" value={country} onChange={(event) => setCountry(event.target.value)}>
              <option value="in">India</option><option value="us">United States</option><option value="gb">United Kingdom</option><option value="ca">Canada</option><option value="au">Australia</option><option value="de">Germany</option><option value="fr">France</option>
            </select>
            <button type="submit" className="btn btn-primary job-search-submit" disabled={liveLoading}><FiSearch /> {liveLoading ? "Searching…" : "Search jobs"}</button>
          </> : <div className="filter-field">
            <FiSliders />
            <select
              aria-label="Sort roles"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="recent">Recently added</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>}
          <span className="result-count">
            {sourceMode === "live" ? `${liveTotal.toLocaleString()} live results` : `${filteredJobs.length} ${filteredJobs.length === 1 ? "role" : "roles"}`}
          </span>
        </form>
        {sourceMode === "live" ? <p className="job-source-note">Live listings provided by Adzuna. Apply on the employer’s site; CareerPilot only tracks your progress.</p> : null}
        {liveLoading ? <div className="page-loading" role="status">Searching live listings…</div> : null}
        <div className="job-list">
          {!liveLoading && filteredJobs.length ? (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                saved={savedIds.includes(String(job.id))}
                application={applicationsByJob[String(job.id)]}
                onSave={handleSave}
                onApply={handleMarkApplied}
                applying={applyingId === job.id}
                sourceMode={sourceMode}
              />
            ))
          ) : !liveLoading ? (
            <div className="empty-state compact">
              <h3>
                {search
                  ? "No matching roles"
                  : sourceMode === "live" ? "Search live job listings" : "No roles in your workspace yet"}
              </h3>
              <p>
                {search
                  ? "Try a different search term."
                  : sourceMode === "live" ? "Enter a job title or keyword, then search to find current opportunities." : "Add a job posting you found, or search live listings to explore current opportunities."}
              </p>
              {!search && sourceMode === "workspace" ? (
                <div className="empty-job-actions"><button type="button" className="btn btn-primary btn-sm" onClick={() => setShowRoleForm(true)}><FiPlus /> Add your first role</button></div>
              ) : null}
            </div>
          ) : null}
        </div>
        {sourceMode === "live" && liveTotal > 20 ? <div className="job-pagination"><button type="button" onClick={() => loadLiveJobs({ page: livePage - 1 })} disabled={liveLoading || livePage <= 1}><FiChevronLeft /> Previous</button><span>Page {livePage} of {Math.max(1, Math.ceil(liveTotal / 20))}</span><button type="button" onClick={() => loadLiveJobs({ page: livePage + 1 })} disabled={liveLoading || livePage >= Math.ceil(liveTotal / 20)}>Next <FiChevronRight /></button></div> : null}
      </div>
    </div>
  );
}
