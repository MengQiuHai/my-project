import express from 'express';
import { HealthController } from '../controllers/HealthController';

const router = express.Router();

// Quick health check - no authentication required
router.get('/', HealthController.quickCheck);

// Database status check
router.get('/database', HealthController.databaseCheck);

// System information
router.get('/info', HealthController.systemInfo);

// Test data for development
router.get('/test', HealthController.testData);

export default router;