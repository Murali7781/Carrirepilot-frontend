const test = require('node:test');
const assert = require('node:assert/strict');

const { pool } = require('../src/config/db');
const { addSampleJobs, sampleJobCount } = require('../src/services/sampleJobService');

const insertedJobs = new Map();
let nextId = 1;

pool.query = async (sql, params) => {
  if (sql.startsWith('SELECT source_job_id')) {
    const [userId, source, sourceIds] = params;
    return [[...insertedJobs.values()]
      .filter((job) => job.user_id === userId && job.source === source && sourceIds.includes(job.source_job_id))
      .map((job) => ({ source_job_id: job.source_job_id }))];
  }

  if (sql.startsWith('INSERT INTO job_descriptions')) {
    for (const values of params[0]) {
      const [userId, title, company, description, requiredSkills, preferredSkills,
        experience, source, sourceJobId, , location, workMode, employmentType] = values;
      insertedJobs.set(`${userId}:${sourceJobId}`, {
        id: nextId++, user_id: userId, title, company, description, required_skills: requiredSkills,
        preferred_skills: preferredSkills, experience_requirements: experience, source,
        source_job_id: sourceJobId, location, work_mode: workMode, employment_type: employmentType,
      });
    }
    return [{ affectedRows: params[0].length }];
  }

  if (sql.includes('FROM job_descriptions')) {
    const [userId, source, sourceIds] = params;
    return [[...insertedJobs.values()]
      .filter((job) => job.user_id === userId && job.source === source && sourceIds.includes(job.source_job_id))];
  }

  throw new Error(`Unexpected SQL in sample job test: ${sql}`);
};

test('sample listings are inserted once per user and returned for their workspace', async () => {
  const first = await addSampleJobs(41);
  const second = await addSampleJobs(41);
  const otherUser = await addSampleJobs(42);

  assert.equal(sampleJobCount, 16);
  assert.equal(first.added, sampleJobCount);
  assert.equal(first.jobs.length, sampleJobCount);
  assert.ok(first.jobs.every((job) => job.source === 'sample'));
  assert.ok(first.jobs.every((job) => job.description.includes('not a live vacancy')));
  assert.equal(second.added, 0);
  assert.equal(second.jobs.length, sampleJobCount);
  assert.equal(otherUser.added, sampleJobCount);
});
