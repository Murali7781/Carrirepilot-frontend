const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://carrirepilot-frontend.vercel.app',
  ...(process.env.CLIENT_ORIGINS || '').split(','),
]
  .map((origin) => origin.trim())
  .filter(Boolean);

const vercelPreviewOriginPattern =
  /^https:\/\/carrirepilot-frontend-[a-z0-9](?:[a-z0-9-]*[a-z0-9])?-murali7781s-projects\.vercel\.app$/;

function isAllowedOrigin(origin) {
  return Boolean(origin) && (
    allowedOrigins.includes(origin) ||
    vercelPreviewOriginPattern.test(origin)
  );
}

module.exports = { isAllowedOrigin };
