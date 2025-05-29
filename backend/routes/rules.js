const express = require('express');

const {
    getRules,
    getRule,
    createRule,
    createRules,
    updateRule,
    deleteRule,
    deleteRules,
    armRule,
    disarmRule,
    bulkArmRules,
    bulkDisarmRules
} = require('../controllers/rulesController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rules
 *   description: Rule management and alerts
 */

/**
 * @swagger
 * /rules:
 *   get:
 *     summary: Get all rules
 *     tags: [Rules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of rules
 */
router.get('/', getRules);

/**
 * @swagger
 * /rules/{id}:
 *   get:
 *     summary: Get a rule by ID
 *     tags: [Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the rule to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rule found
 *       404:
 *         description: Rule not found
 */
router.get('/:id', getRule);

/**
 * @swagger
 * /rules:
 *   post:
 *     summary: Create a new rule
 *     tags: [Rules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ruleName
 *               - ruleDescription
 *               - metric
 *               - threshold
 *               - condition
 *               - notificationChannel
 *             properties:
 *               ruleName:
 *                 type: string
 *               ruleDescription:
 *                 type: string
 *               metric:
 *                 type: string
 *               threshold:
 *                 type: number
 *               condition:
 *                 type: string
 *               notificationChannel:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rule created
 */
router.post('/', createRule);

/**
 * @swagger
 * /rules/rules:
 *   post:
 *     summary: Create multiple rules
 *     tags: [Rules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rules:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Rules created
 */
router.post('/rules', createRules);

/**
 * @swagger
 * /rules/{id}:
 *   put:
 *     summary: Update a rule
 *     tags: [Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Rule updated
 */
router.put('/:id', updateRule);

/**
 * @swagger
 * /rules/{id}:
 *   delete:
 *     summary: Delete a rule
 *     tags: [Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rule deleted
 */
router.delete('/:id', deleteRule);

/**
 * @swagger
 * /rules/bulk-delete:
 *   post:
 *     summary: Delete multiple rules
 *     tags: [Rules]
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
 *                 description: Array of rule IDs to delete
 *     responses:
 *       200:
 *         description: Rules deleted successfully
 *       400:
 *         description: Bad request (e.g., invalid or missing IDs)
 *       404:
 *         description: No rules found to delete
 *       500:
 *         description: Server error
 */
router.post('/bulk-delete', deleteRules);

/**
 * @swagger
 * /rules/{id}/arm:
 *   patch:
 *     summary: Re-arm a rule
 *     tags: [Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Rule ID
 *     responses:
 *       200:
 *         description: Rule re-armed
 */
router.patch('/:id/arm', armRule);

/**
 * @swagger
 * /rules/{id}/disarm:
 *   patch:
 *     summary: Disarm a rule
 *     tags: [Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Rule ID
 *     responses:
 *       200:
 *         description: Rule disarmed successfully
 *       404:
 *         description: Rule not found
 */
router.patch('/:id/disarm', disarmRule);

/**
 * @swagger
 * /rules/bulk-arm:
 *   post:
 *     summary: Arm multiple rules
 *     tags: [Rules]
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
 *                 description: Array of rule IDs to arm
 *     responses:
 *       200:
 *         description: Rules armed successfully
 *       400:
 *         description: Bad request (e.g., invalid or missing IDs)
 */
router.post('/bulk-arm', bulkArmRules);

/**
 * @swagger
 * /rules/bulk-disarm:
 *   post:
 *     summary: Disarm multiple rules
 *     tags: [Rules]
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
 *                 description: Array of rule IDs to disarm
 *     responses:
 *       200:
 *         description: Rules disarmed successfully
 *       400:
 *         description: Bad request (e.g., invalid or missing IDs)
 */
router.post('/bulk-disarm', bulkDisarmRules);

module.exports = router;
