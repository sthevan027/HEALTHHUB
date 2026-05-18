import { Router } from 'express';
import * as mealsController from '../controllers/mealsController';

const router = Router();

router.get('/week', mealsController.getWeek);
router.get('/', mealsController.getByDate);
router.post('/', mealsController.create);
router.put('/:id', mealsController.update);
router.delete('/:id', mealsController.remove);

export default router;
