const { pool } = require('../config/db');

const sampleJobs = [
  {
    id: 'cp-sample-001', title: 'Frontend Developer', company: 'Example Product Studio',
    location: 'Bengaluru, Karnataka', workMode: 'Hybrid', experience: '1–3 years',
    employmentType: 'Full-time', skills: ['JavaScript', 'React', 'HTML', 'CSS', 'REST APIs'],
    description: 'Practice listing — not a live vacancy. Build accessible product interfaces with React, work with designers and API teams, and improve page performance. Example requirements include JavaScript, React, HTML, CSS, and REST APIs.',
  },
  {
    id: 'cp-sample-002', title: 'Backend Developer – Node.js', company: 'Example Cloud Systems',
    location: 'Hyderabad, Telangana', workMode: 'Hybrid', experience: '2–4 years',
    employmentType: 'Full-time', skills: ['Node.js', 'Express', 'SQL', 'REST APIs', 'Testing'],
    description: 'Practice listing — not a live vacancy. Design API endpoints, implement authentication and validation, and work with relational data. Example requirements include Node.js, Express, SQL, REST APIs, and automated testing.',
  },
  {
    id: 'cp-sample-003', title: 'Full Stack Engineer', company: 'Example Digital Labs',
    location: 'Pune, Maharashtra', workMode: 'Remote', experience: '2–5 years',
    employmentType: 'Full-time', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
    description: 'Practice listing — not a live vacancy. Develop full-stack features from the browser through the API and database. Example requirements include React, Node.js, TypeScript, PostgreSQL, and Docker.',
  },
  {
    id: 'cp-sample-004', title: 'Python Software Engineer', company: 'Example Data Works',
    location: 'Chennai, Tamil Nadu', workMode: 'On-site', experience: '1–3 years',
    employmentType: 'Full-time', skills: ['Python', 'Django', 'PostgreSQL', 'REST APIs', 'Git'],
    description: 'Practice listing — not a live vacancy. Build maintainable web services and support production features. Example requirements include Python, Django, PostgreSQL, REST APIs, and Git.',
  },
  {
    id: 'cp-sample-005', title: 'Data Analyst', company: 'Example Insights Co.',
    location: 'Mumbai, Maharashtra', workMode: 'Hybrid', experience: '1–3 years',
    employmentType: 'Full-time', skills: ['SQL', 'Python', 'Excel', 'Power BI', 'Data visualization'],
    description: 'Practice listing — not a live vacancy. Explore business data, communicate findings, and prepare dashboards. Example requirements include SQL, Python, spreadsheets, Power BI, and data visualization.',
  },
  {
    id: 'cp-sample-006', title: 'Machine Learning Engineer', company: 'Example AI Studio',
    location: 'Bengaluru, Karnataka', workMode: 'Hybrid', experience: '2–5 years',
    employmentType: 'Full-time', skills: ['Python', 'scikit-learn', 'PyTorch', 'Model evaluation', 'MLOps'],
    description: 'Practice listing — not a live vacancy. Develop, evaluate, and deploy machine-learning workflows with clear monitoring. Example requirements include Python, model evaluation, PyTorch or scikit-learn, and MLOps fundamentals.',
  },
  {
    id: 'cp-sample-007', title: 'Product Designer (UI/UX)', company: 'Example Design Collective',
    location: 'Delhi, India', workMode: 'Hybrid', experience: '2–4 years',
    employmentType: 'Full-time', skills: ['Figma', 'Prototyping', 'User research', 'Accessibility', 'Design systems'],
    description: 'Practice listing — not a live vacancy. Turn user research into accessible flows and reusable interface patterns. Example requirements include Figma, prototyping, usability testing, accessibility, and design systems.',
  },
  {
    id: 'cp-sample-008', title: 'QA Automation Engineer', company: 'Example Quality Engineering',
    location: 'Noida, Uttar Pradesh', workMode: 'Hybrid', experience: '2–4 years',
    employmentType: 'Full-time', skills: ['Playwright', 'JavaScript', 'API testing', 'CI/CD', 'SQL'],
    description: 'Practice listing — not a live vacancy. Create reliable browser and API tests and work with engineers to improve release confidence. Example requirements include Playwright, JavaScript, API testing, CI/CD, and SQL.',
  },
  {
    id: 'cp-sample-009', title: 'DevOps Engineer', company: 'Example Platform Group',
    location: 'Gurugram, Haryana', workMode: 'Hybrid', experience: '2–5 years',
    employmentType: 'Full-time', skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    description: 'Practice listing — not a live vacancy. Improve deployment automation, platform reliability, and observability. Example requirements include AWS, Docker, Kubernetes, Terraform, and CI/CD.',
  },
  {
    id: 'cp-sample-010', title: 'Android Application Developer', company: 'Example Mobile Products',
    location: 'Kochi, Kerala', workMode: 'Remote', experience: '1–4 years',
    employmentType: 'Full-time', skills: ['Kotlin', 'Android', 'Jetpack Compose', 'REST APIs', 'Testing'],
    description: 'Practice listing — not a live vacancy. Build and test mobile application features with attention to performance and accessibility. Example requirements include Kotlin, Android, Jetpack Compose, REST APIs, and testing.',
  },
  {
    id: 'cp-sample-011', title: 'iOS Developer', company: 'Example Mobile Products',
    location: 'Remote, India', workMode: 'Remote', experience: '2–4 years',
    employmentType: 'Full-time', skills: ['Swift', 'SwiftUI', 'iOS', 'REST APIs', 'XCTest'],
    description: 'Practice listing — not a live vacancy. Develop polished iOS features and collaborate across product and engineering. Example requirements include Swift, SwiftUI, REST APIs, and XCTest.',
  },
  {
    id: 'cp-sample-012', title: 'Technical Support Engineer', company: 'Example SaaS Support',
    location: 'Indore, Madhya Pradesh', workMode: 'On-site', experience: '0–2 years',
    employmentType: 'Full-time', skills: ['Troubleshooting', 'SQL', 'Linux', 'Customer support', 'Networking'],
    description: 'Practice listing — not a live vacancy. Investigate technical customer issues, document solutions, and escalate reproducible defects. Example requirements include troubleshooting, SQL basics, Linux, networking, and clear communication.',
  },
  {
    id: 'cp-sample-013', title: 'Cloud Security Analyst', company: 'Example Secure Cloud',
    location: 'Bengaluru, Karnataka', workMode: 'Hybrid', experience: '2–5 years',
    employmentType: 'Full-time', skills: ['AWS', 'IAM', 'SIEM', 'Incident response', 'Python'],
    description: 'Practice listing — not a live vacancy. Review cloud security signals, investigate alerts, and recommend risk-reducing controls. Example requirements include AWS, IAM, SIEM, incident response, and Python scripting.',
  },
  {
    id: 'cp-sample-014', title: 'Business Analyst', company: 'Example Enterprise Solutions',
    location: 'Ahmedabad, Gujarat', workMode: 'Hybrid', experience: '1–4 years',
    employmentType: 'Full-time', skills: ['Requirements gathering', 'SQL', 'Excel', 'Agile', 'Stakeholder management'],
    description: 'Practice listing — not a live vacancy. Clarify business needs, document requirements, and support iterative delivery. Example requirements include stakeholder interviews, SQL, spreadsheets, Agile, and process mapping.',
  },
  {
    id: 'cp-sample-015', title: 'Java Software Developer', company: 'Example Enterprise Solutions',
    location: 'Jaipur, Rajasthan', workMode: 'On-site', experience: '1–4 years',
    employmentType: 'Full-time', skills: ['Java', 'Spring Boot', 'Microservices', 'SQL', 'JUnit'],
    description: 'Practice listing — not a live vacancy. Build and test service-oriented application features. Example requirements include Java, Spring Boot, SQL, microservices, and JUnit.',
  },
  {
    id: 'cp-sample-016', title: 'Content and SEO Specialist', company: 'Example Growth Studio',
    location: 'Remote, India', workMode: 'Remote', experience: '1–3 years',
    employmentType: 'Full-time', skills: ['SEO', 'Content strategy', 'Analytics', 'Keyword research', 'Writing'],
    description: 'Practice listing — not a live vacancy. Plan helpful content, research search intent, and measure organic performance. Example requirements include SEO, keyword research, analytics, editing, and content strategy.',
  },
];

async function addSampleJobs(userId) {
  const sourceIds = sampleJobs.map((job) => job.id);
  const [existingRows] = await pool.query(
    'SELECT source_job_id FROM job_descriptions WHERE user_id = ? AND source = ? AND source_job_id IN (?)',
    [userId, 'sample', sourceIds],
  );
  const existingIds = new Set(existingRows.map((row) => row.source_job_id));
  const missingJobs = sampleJobs.filter((job) => !existingIds.has(job.id));

  if (missingJobs.length) {
    await pool.query(
      `INSERT INTO job_descriptions
       (user_id, title, company, description, required_skills, preferred_skills,
        experience_requirements, source, source_job_id, source_country, location,
        work_mode, employment_type)
       VALUES ?`,
      [missingJobs.map((job) => [
        userId,
        job.title,
        job.company,
        job.description,
        JSON.stringify(job.skills),
        JSON.stringify([]),
        job.experience,
        'sample',
        job.id,
        '',
        job.location,
        job.workMode,
        job.employmentType,
      ])],
    );
  }

  const [rows] = await pool.query(
    `SELECT id, user_id, title, company, description, required_skills, preferred_skills,
            experience_requirements, source, location, work_mode, employment_type,
            source_url, created_at, updated_at
     FROM job_descriptions
     WHERE user_id = ? AND source = ? AND source_job_id IN (?)`,
    [userId, 'sample', sourceIds],
  );
  const rowsBySourceId = new Map(rows.map((row) => [row.source_job_id, row]));
  return {
    jobs: sourceIds.map((sourceId) => rowsBySourceId.get(sourceId)).filter(Boolean),
    added: missingJobs.length,
  };
}

module.exports = { addSampleJobs, sampleJobCount: sampleJobs.length };
