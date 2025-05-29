const express = require('express');
const { getRuleBreachLogs, getRuleBreachLogsByRuleId } = require('../controllers/ruleBreachLogController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rule Breach Logs
 *   description: Track historical rule breaches
 */

/**
 * @swagger
 * /rule-breach-logs:
 *   get:
 *     summary: Get all rule breach logs
 *     tags: [Rule Breach Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all rule breach logs
 */
router.get('/', protect, getRuleBreachLogs);

/**
 * @swagger
 * /rule-breach-logs/{ruleId}:
 *   get:
 *     summary: Get breach logs for a specific rule
 *     tags: [Rule Breach Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: ruleId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Rule ID
 *     responses:
 *       200:
 *         description: List of breach logs for a specific rule
 */
//router.get('/:ruleId', protect, getRuleBreachLogsByRuleId);

module.exports = router;
