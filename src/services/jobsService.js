import api from './api';

const savedJobsKey = 'careerpilot_saved_jobs';

export async function getJobs() {
  const response = await api.get('/jobs');
  return response.data.data.jobs || [];
}

export async function saveJob(jobId) {
  try {
    const response = await api.post('/saved-jobs', { jobId });
    return response.data.data?.savedJob || { job_id: jobId };
  } catch (error) {
    if (error.response?.status !== 404 && error.response?.status !== 405) throw error;
    const saved = JSON.parse(localStorage.getItem(savedJobsKey) || '[]');
    const next = saved.includes(String(jobId)) ? saved : [...saved, String(jobId)];
    localStorage.setItem(savedJobsKey, JSON.stringify(next));
    return { id: jobId, localOnly: true };
  }
}

export async function unsaveJob(jobId, savedJobId = null) {
  try {
    if (savedJobId) {
      await api.delete(`/saved-jobs/${savedJobId}`);
    } else {
      const savedJobs = await getSavedJobs();
      const savedJob = savedJobs.find((item) => String(item.job_id) === String(jobId));
      if (savedJob) await api.delete(`/saved-jobs/${savedJob.id}`);
    }
  } catch (error) {
    if (error.response?.status !== 404 && error.response?.status !== 405) throw error;
  }

  const saved = JSON.parse(localStorage.getItem(savedJobsKey) || '[]');
  localStorage.setItem(savedJobsKey, JSON.stringify(saved.filter((id) => id !== String(jobId))));
}

export function getLocalSavedJobIds() {
  return JSON.parse(localStorage.getItem(savedJobsKey) || '[]');
}

export async function getSavedJobs() {
  const response = await api.get('/saved-jobs');
  return response.data.data?.jobs || [];
}

export async function applyToJob(jobId, payload = {}) {
  return api.post('/applications', { jobId, ...payload });
}
