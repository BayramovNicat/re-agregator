import { Router } from 'express';
import { triggerScrape, streamScrape } from '../controllers/scrape.controller.js';

const router = Router();

router.post('/trigger', triggerScrape);
router.get('/stream', streamScrape);

export default router;
