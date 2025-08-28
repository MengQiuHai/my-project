import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { ResponseHelper } from '../utils/response';

const router = express.Router();

// 临时占位符路由，后续会完善
router.get('/', authenticateToken, async (req, res) => {
  ResponseHelper.success(res, [], 'Tasks feature coming soon');
});

export default router;