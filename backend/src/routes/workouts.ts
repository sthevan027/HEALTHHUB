import { Router } from 'express';
import * as workoutsController from '../controllers/workoutsController';

const router = Router();

router.get('/month', workoutsController.getMonth);
router.get('/', workoutsController.getByDate);
router.post('/', workoutsController.create);
router.put('/:id', workoutsController.update);
router.delete('/:id', workoutsController.remove);

export default router;
