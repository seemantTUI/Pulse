const express = require('express');

const {
    getMetrics,
    getMetric,
    createMetric,
    createMetrics,
    updateMetric,
    deleteMetric,
    deleteMetrics
} = require('../controllers/metricsController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Metrics
 *   description: Metric management
 */

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Get all metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all metrics
 */
router.get('/', getMetrics);

/**
 * @swagger
 * /metrics/{id}:
 *   get:
 *     summary: Get a metric by ID
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Metric ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Metric retrieved
 *       404:
 *         description: Metric not found
 */
router.get('/:id', getMetric);

/**
 * @swagger
 * /metrics:
 *   post:
 *     summary: Create a new metric
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metricName
 *               - value
 *             properties:
 *               metricName:
 *                 type: string
 *               value:
 *                 type: number
 *     responses:
 *       201:
 *         description: Metric created
 */
router.post('/', createMetric);

/**
 * @swagger
 * /metrics/metrics:
 *   post:
 *     summary: Create multiple metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     metricName:
 *                       type: string
 *                     value:
 *                       type: number
 *     responses:
 *       201:
 *         description: Metrics created
 */
router.post('/metrics', createMetrics);

/**
 * @swagger
 * /metrics/{id}:
 *   put:
 *     summary: Update a metric
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Metric ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metricName:
 *                 type: string
 *               value:
 *                 type: number
 *     responses:
 *       200:
 *         description: Metric updated
 */
router.put('/:id', updateMetric);

/**
 * @swagger
 * /metrics/{id}:
 *   delete:
 *     summary: Delete a metric
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Metric ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Metric deleted
 */
router.delete('/:id', deleteMetric);

/**
 * @swagger
 * /metrics:
 *   delete:
 *     summary: Delete multiple metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Metrics deleted
 */
router.delete('/', deleteMetrics);

module.exports = router;
