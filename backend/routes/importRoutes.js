const express = require('express');
const { importData } = require('../controllers/importController');
const {exportData} = require("../controllers/exportController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Import
 *   description: Import rules or metrics from JSON or XML
 */

/**
 * @swagger
 * /import:
 *   post:
 *     summary: Import rules or metrics in JSON or XML format
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rules, metrics]
 *         required: true
 *         description: Type of data to import (rules or metrics)
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, xml]
 *         required: true
 *         description: Format of the import file
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/Rule'
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/Metric'
 *         application/xml:
 *           schema:
 *             type: string
 *     responses:
 *       200:
 *         description: Data imported successfully
 *       400:
 *         description: Validation failed or duplicate entry
 *       500:
 *         description: Server error during import
 */

router.post('/', express.text({ type: ['application/xml'] }), express.json({ type: ['application/json'] }), importData);


module.exports = router;
