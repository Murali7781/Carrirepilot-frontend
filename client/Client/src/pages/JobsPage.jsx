import { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiSliders } from 'react-icons/fi';
import JobCard from '../components/jobs/JobCard';
import { applyToJob, getJobs, getSavedJobs, getLocalSavedJobIds, saveJob, unsaveJob } from '../services/jobsService';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(getLocalSavedJobIds);
  const [savedJobRecords, setSavedJobRecords] = useState({});
  const [applyingId, setApplyingId] = useState(null);
  const [notice, setNotice] = useState('');
  const [sort, setSort] = useState('recent');

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const [jobList, savedJobs] = await Promise.all([getJobs(), getSavedJobs()]);
        setJobs(jobList);
        setSavedIds(savedJobs.map((savedJob) => String(savedJob.job_id)));
        setSavedJobRecords(Object.fromEntries(savedJobs.map((savedJob) => [String(savedJob.job_id), savedJob.id])));
      } catch (error) {
        setNotice(error.response?.data?.message || 'Unable to load jobs right now.');
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;

    const results = jobs.filter((job) => {
      const haystack = `${job.title} ${job.company || ''} ${job.description || ''}`.toLowerCase();
      return haystack.includes(q);
    });
    return [...results].sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [jobs, search, sort]);

  const handleSave = async (job) => {
    const isSaved = savedIds.includes(String(job.id));
    if (isSaved) {
      await unsaveJob(job.id, savedJobRecords[String(job.id)]);
      setSavedJobRecords((current) => {
        const next = { ...current };
        delete next[String(job.id)];
        return next;
      });
    } else {
      const savedJob = await saveJob(job.id);
      if (savedJob.id) {
        setSavedJobRecords((current) => ({ ...current, [String(job.id)]: savedJob.id }));
      }
    }
    setSavedIds((current) => isSaved ? current.filter((id) => id !== String(job.id)) : [...current, String(job.id)]);
  };

  const handleApply = async (job) => {
    setApplyingId(job.id);
    setNotice('');
    try {
      await applyToJob(job.id);
      setNotice(`Application started for ${job.title}.`);
    } catch (error) {
      setNotice(error.response?.status === 404 ? 'Application tracking is not available yet. Save the role to keep it on your shortlist.' : (error.response?.data?.message || 'Unable to apply to this role.'));
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading jobs...</div>;
  }

  return (
    <div className="page-section">
      <div className="page-heading"><div><div className="eyebrow">Discover your next move</div><h2>Find jobs</h2><p>Search your job workspace and keep the roles that match your direction close.</p></div><span className="result-count">{filteredJobs.length} roles</span></div>
      <div className="panel-card job-search-panel">
        <div className="job-search-row"><div className="search-field"><FiSearch /><input placeholder="Search by title, company, or keyword" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="filter-field"><FiSliders /><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Recently added</option><option value="title">Title A–Z</option></select></div></div>
        {notice ? <div className="alert alert-info mt-3 mb-0">{notice}</div> : null}
        <div className="job-list">
          {filteredJobs.length ? (
            filteredJobs.map((job) => <JobCard key={job.id} job={job} saved={savedIds.includes(String(job.id))} onSave={handleSave} onApply={handleApply} applying={applyingId === job.id} />)
          ) : (
            <div className="empty-state compact"><h3>No roles found</h3><p>Try a broader keyword or check back after adding more opportunities.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
