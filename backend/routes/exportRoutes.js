const express = require('express');
const { exportData } = require('../controllers/exportController');



const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Export rules, metrics, logs, and notifications
 */

/**
 * @swagger
 * /export:
 *   get:
 *     summary: Export data as JSON, CSV, or XML
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rules, metrics, notifications, metricLogs, ruleBreachLogs]
 *         required: true
 *         description: Type of data to export
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, xml]
 *         required: false
 *         description: Export format (default is JSON)
 *     responses:
 *       200:
 *         description: Exported file
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *           text/csv:
 *             schema:
 *               type: string
 *           application/xml:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid export type or format
 *       500:
 *         description: Server error
 */
router.get('/', exportData);

module.exports = router;
