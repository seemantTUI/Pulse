const Rule = require('../models/ruleModel');
const Metric = require('../models/metricModel');
const xml2js = require('xml2js');
const mongoose = require('mongoose');

const modelMap = {
    rules: Rule,
    metrics: Metric,
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const resolveMetricRefs = async (rule, userId) => {
    const resolveOperand = async (operand) => {
        if (operand?.exprType === 'metric' && operand.metric) {
            const query = {};

            if (isValidObjectId(operand.metric)) {
                query._id = operand.metric;
            } else {
                query.metricName = operand.metric;
            }

            const metric = await Metric.findOne(query);
            if (!metric) {
                throw new Error(`Referenced metric '${operand.metric}' not found.`);
            }

            operand.metric = metric._id;
        }

        if (operand?.args?.length) {
            for (const arg of operand.args) {
                await resolveOperand(arg);
            }
        }
    };

    const resolveExpression = async (expr) => {
        if (expr.left) await resolveOperand(expr.left);
        if (expr.right) await resolveOperand(expr.right);
        if (expr.children?.length) {
            for (const child of expr.children) {
                await resolveExpression(child);
            }
        }
    };

    await resolveExpression(rule.expression);
};

const importData = async (req, res) => {
    const { type } = req.query;

    if (!modelMap[type]) {
        return res.status(400).json({ error: 'Invalid import type' });
    }

    if (!req.is('application/json') && !req.is('application/xml')) {
        return res.status(400).json({ error: 'Only JSON and XML formats are supported' });
    }

    const parseData = async () => {
        if (req.is('application/json')) {
            return req.body;
        }

        if (req.is('application/xml')) {
            const xml = req.body;

            const parsed = await xml2js.parseStringPromise(xml, {
                explicitArray: false,
                explicitRoot: false,
                trim: true,
                mergeAttrs: true,
                valueProcessors: [xml2js.processors.parseNumbers],
            });

            const keys = Object.keys(parsed);
            const firstKey = keys.find(k => Array.isArray(parsed[k]) || typeof parsed[k] === 'object');
            const rawItems = parsed[firstKey];
            const items = Array.isArray(rawItems) ? rawItems : [rawItems];

            const flatten = (obj) => {
                const result = {};
                for (const key in obj) {
                    const val = obj[key];
                    if (val && typeof val === 'object' && '_' in val) {
                        result[key] = val._;
                    } else {
                        result[key] = val;
                    }
                }
                return result;
            };

            return items.map(flatten);
        }

        throw new Error('Unsupported format');
    };

    try {
        const rawData = await parseData();

        if (!Array.isArray(rawData) || rawData.length === 0) {
            return res.status(400).json({ error: 'No valid data found' });
        }

        const userId = req.user._id;

        // Only add user for rules, NOT for metrics
        const cleanedData = rawData.map(item => {
            let doc = { ...item };
            if (type === 'rules') doc.user = userId;

            if (type === 'metrics' && typeof doc.value === 'string') {
                doc.value = parseFloat(doc.value);
            }
            if (type === 'rules' && typeof doc.isArmed === 'string') {
                doc.isArmed = doc.isArmed.toLowerCase() === 'true';
            }
            return doc;
        });

        if (type === 'rules') {
            for (const rule of cleanedData) {
                await resolveMetricRefs(rule, userId);
            }
        }

        const docs = cleanedData.map(d => new modelMap[type](d));
        for (const doc of docs) {
            await doc.validate();
        }

        // --------- DUPLICATE CHECK --------------
        for (const doc of docs) {
            let query;
            if (type === 'rules') {
                query = { user: userId, ruleName: doc.ruleName };
            } else if (type === 'metrics') {
                query = { metricName: doc.metricName };
            }

            const exists = await modelMap[type].findOne(query);
            if (exists) {
                return res.status(409).json({
                    error: `Duplicate ${type.slice(0, -1)}: ${query.ruleName || query.metricName}`,
                });
            }
        }
        // -----------------------------------------

        await modelMap[type].insertMany(cleanedData);
        res.status(200).json({ message: `${type} imported successfully`, count: cleanedData.length });

    } catch (err) {
        console.error('Import error:', err);
        res.status(400).json({ error: err.message || 'Invalid data format' });
    }
};

module.exports = { importData };
