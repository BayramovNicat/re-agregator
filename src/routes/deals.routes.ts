import { Router } from 'express';
import { getUrgentDeals, getUndervaluedDeals } from '../controllers/deals.controller.js';

const router = Router();

router.get('/urgent', getUrgentDeals);
router.get('/undervalued', getUndervaluedDeals);

export default router;
