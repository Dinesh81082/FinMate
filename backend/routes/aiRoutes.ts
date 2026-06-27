import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.ts';
import { aiChatHandler } from '../controllers/aiController.ts';

const router = Router();

router.use(authenticateJWT as any);

router.post('/chat', aiChatHandler as any);

export default router;
