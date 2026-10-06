import api from './api';

export async function getJobs() {
  const response = await api.get('/jobs', { params: { limit: 100 } });
  return response.data.data.jobs || [];
}

export async function saveJob(jobId) {
  const response = await api.post('/saved-jobs', { jobId });
  return response.data.data?.savedJob || { job_id: jobId };
}

export async function unsaveJob(jobId, savedJobId = null) {
  if (savedJobId) return api.delete(`/saved-jobs/${savedJobId}`);
  const savedJobs = await getSavedJobs();
  const savedJob = savedJobs.find((item) => String(item.job_id) === String(jobId));
  if (savedJob) return api.delete(`/saved-jobs/${savedJob.id}`);
  return null;
}

export async function createJob(payload) {
  const response = await api.post('/jobs', payload);
  return response.data.data.job;
}

export async function getSavedJobs() {
  const response = await api.get('/saved-jobs');
  return response.data.data?.jobs || [];
}

export async function applyToJob(jobId, payload = {}) {
  return api.post('/applications', { jobId, ...payload });
}
