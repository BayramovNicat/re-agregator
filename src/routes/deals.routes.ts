import { Router } from 'express';
import { getLocations, getUrgentDeals, getUndervaluedDeals } from '../controllers/deals.controller.js';

const router = Router();

router.get('/locations', getLocations);
router.get('/urgent', getUrgentDeals);
router.get('/undervalued', getUndervaluedDeals);

export default router;
