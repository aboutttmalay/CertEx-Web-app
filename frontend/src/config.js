const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const API_ROUTES = {
  base: API_BASE_URL,
  analyzeFile: `${API_BASE_URL}/api/analyze-file`,
  transformData: `${API_BASE_URL}/api/transform-data`,
  downloadDataset: `${API_BASE_URL}/api/download-dataset`,
  ingestSql: `${API_BASE_URL}/api/ingest-sql`,
  askAgent: `${API_BASE_URL}/api/ask-agent`,
  runGhostFactory: `${API_BASE_URL}/api/run-ghost-factory`,
  capabilities: `${API_BASE_URL}/api/capabilities`,
  workflow: `${API_BASE_URL}/api/workflow`,
  integrityCheck: `${API_BASE_URL}/api/integrity-check`,
};
