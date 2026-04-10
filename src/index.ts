import express from 'express';
import dealsRoutes from './routes/deals.routes.js';
import scrapeRoutes from './routes/scrape.routes.js';

const app = express();
const PORT = process.env['PORT'] ?? 3000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/deals', dealsRoutes);
app.use('/api/scrape', scrapeRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log('Routes:');
  console.log('  GET  /health');
  console.log('  GET  /api/deals/urgent');
  console.log('  GET  /api/deals/undervalued?district=Yasamal&threshold=10');
  console.log('  POST /api/scrape/trigger');
  console.log('  GET  /api/scrape/stream?maxPages=20&delayMs=800');
});
