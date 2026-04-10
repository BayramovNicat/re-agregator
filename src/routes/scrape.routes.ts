import { Router } from 'express';
import { triggerScrape } from '../controllers/scrape.controller.js';

const router = Router();

router.post('/trigger', triggerScrape);

export default router;
