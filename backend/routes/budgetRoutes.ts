import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.ts';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget
} from '../controllers/budgetController.ts';

const router = Router();

router.use(authenticateJWT as any);

router.get('/', getBudgets as any);
router.post('/', createBudget as any);
router.put('/:id', updateBudget as any);
router.delete('/:id', deleteBudget as any);

export default router;
