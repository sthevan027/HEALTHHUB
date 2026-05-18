import { Router } from 'express';
import * as waterController from '../controllers/waterController';

const router = Router();

router.get('/stats/week', waterController.getWeekStats);
router.get('/', waterController.getByDate);
router.post('/', waterController.create);
router.delete('/:id', waterController.remove);

export default router;
