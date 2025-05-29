const express = require('express');
const router = express.Router();
const { getMetricLogs } = require('../controllers/metricLogsController');
const protect = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Metric Logs
 *   description: Metric value history
 */

/**
 * @swagger
 * /metric-logs/{metricId}:
 *   get:
 *     summary: Get metric logs by metric ID
 *     tags: [Metric Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metricId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the metric
 *     responses:
 *       200:
 *         description: Metric logs retrieved
 *       400:
 *         description: Invalid ID
 *       500:
 *         description: Server error
 */
router.get('/:metricId', protect, getMetricLogs);

module.exports = router;
