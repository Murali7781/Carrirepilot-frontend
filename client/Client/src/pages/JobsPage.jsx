import { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiSliders } from 'react-icons/fi';
import JobCard from '../components/jobs/JobCard';
import { applyToJob, getJobs, getSavedJobs, getLocalSavedJobIds, saveJob, unsaveJob } from '../services/jobsService';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [sourceMode, setSourceMode] = useState(null);
  const [total, setTotal] = useState(0);
  const [savedIds, setSavedIds] = useState(getLocalSavedJobIds);
  const [savedJobRecords, setSavedJobRecords] = useState({});
  const [pendingJobId, setPendingJobId] = useState(null);
  const [notice, setNotice] = useState('');
  const [noticeKind, setNoticeKind] = useState('info');
  const [sort, setSort] = useState('recent');

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const result = await getJobs({ search, location });
        if (!active) return;
        setJobs(result.jobs || []);
        setSourceMode(result.sourceMode || 'demo');
        setTotal(Number(result.pagination?.total) || result.jobs?.length || 0);
        setNotice('');
      } catch (error) {
        if (active) {
          setJobs([]);
          setNotice(error.response?.data?.message || 'Unable to load job listings right now.');
          setNoticeKind('danger');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, location]);

  useEffect(() => {
    let active = true;
    getSavedJobs()
      .then((savedJobs) => {
        if (!active) return;
        setSavedIds(savedJobs.map((item) => String(item.job_id)));
        setSavedJobRecords(Object.fromEntries(savedJobs.map((item) => [String(item.job_id), item.id])));
      })
      .catch(() => {
        if (active) {
          setNotice('Saved roles could not be loaded. Other job actions are still available.');
          setNoticeKind('warning');
        }
      });
    return () => { active = false; };
  }, []);

  const sortedJobs = useMemo(() => [...jobs].sort((a, b) => {
    if (sort === 'title') return String(a.title).localeCompare(String(b.title));
    return new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0);
  }), [jobs, sort]);

  const handleSave = async (job) => {
    const id = String(job.id);
    const isSaved = savedIds.includes(id);
    setPendingJobId(id);
    setNotice('');
    try {
      if (isSaved) {
        await unsaveJob(job.id, savedJobRecords[id]);
        setSavedJobRecords((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        setSavedIds((current) => current.filter((savedId) => savedId !== id));
        setNotice('Removed from your saved roles.');
      } else {
        const savedJob = await saveJob(job.id);
        setSavedJobRecords((current) => ({ ...current, [id]: savedJob.id }));
        setSavedIds((current) => current.includes(id) ? current : [...current, id]);
        setNotice('Saved to your shortlist.');
      }
      setNoticeKind('success');
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to update your saved roles.');
      setNoticeKind('danger');
    } finally {
      setPendingJobId(null);
    }
  };

  const handleTrackApplication = async (job) => {
    setPendingJobId(String(job.id));
    setNotice('');
    try {
      const response = await applyToJob(job.id);
      setNotice(response.data.message === 'Application already exists'
        ? 'This role is already in your application tracker.'
        : 'Added to your application tracker. Open the original posting to complete the application.');
      setNoticeKind('success');
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to add this role to your tracker.');
      setNoticeKind('danger');
    } finally {
      setPendingJobId(null);
    }
  };

  return (
    <div className="page-section jobs-page">
      <header className="page-heading">
        <div>
          <div className="eyebrow">Opportunity search</div>
          <h2>Find your next role</h2>
          <p>Search listings, compare requirements, and keep your follow-ups organized.</p>
        </div>
        <span className="result-count">{loading ? 'Searching…' : `${total} ${total === 1 ? 'role' : 'roles'}`}</span>
      </header>

      {sourceMode === 'demo' ? (
        <div className="source-notice" role="status">
          <strong>Sample listings</strong>
          <span>These example roles are for development. Add Adzuna API credentials to the server to search live job listings.</span>
        </div>
      ) : null}
      {sourceMode === 'live' ? (
        <div className="source-notice source-notice-live" role="status">
          <strong>Live listings from Adzuna</strong>
          <span>Descriptions may be shortened. Check the source posting for full details, salary terms, and current availability.</span>
          <a className="adzuna-attribution" href="https://www.adzuna.com/" target="_blank" rel="noreferrer noopener"><span>Jobs</span><b>Adzuna</b></a>
        </div>
      ) : null}

      <section className="panel-card job-search-panel" aria-label="Search jobs">
        <div className="job-search-controls">
          <label className="search-field" htmlFor="job-search">
            <FiSearch aria-hidden="true" />
            <input id="job-search" placeholder="Job title, company, or keyword" value={search} maxLength={100} onChange={(event) => { setSearch(event.target.value); setLoading(true); }} />
          </label>
          <label className="search-field location-search" htmlFor="job-location">
            <FiSliders aria-hidden="true" />
            <input id="job-location" placeholder="City or region" value={location} maxLength={100} disabled={sourceMode === 'demo'} onChange={(event) => { setLocation(event.target.value); setLoading(true); }} />
          </label>
          <label className="filter-field" htmlFor="job-sort">
            <span className="visually-hidden">Sort roles</span>
            <select id="job-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="recent">Most recent</option>
              <option value="title">Title A–Z</option>
            </select>
          </label>
        </div>
        {notice ? <div className={`alert alert-${noticeKind} mt-3 mb-0`} role="status">{notice}</div> : null}

        <div className="job-list" aria-live="polite">
          {loading ? <div className="page-loading">Finding relevant roles…</div> : null}
          {!loading && sortedJobs.length ? sortedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              saved={savedIds.includes(String(job.id))}
              onSave={handleSave}
              onApply={handleTrackApplication}
              applying={pendingJobId === String(job.id)}
            />
          )) : null}
          {!loading && !sortedJobs.length ? (
            <div className="empty-state compact">
              <h3>{notice ? 'Listings are unavailable' : 'No roles match this search'}</h3>
              <p>{notice ? 'Check your provider setup or try again shortly.' : 'Try a broader role title or location.'}</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
