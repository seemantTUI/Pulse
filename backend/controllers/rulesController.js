// controllers/ruleController.js
const Rule = require('../models/ruleModel');
const mongoose = require('mongoose');
const appEvents = require('../events'); // <-- fix import path if needed!

// GET /rules
const getRules = async (req, res) => {
    const { startDate, endDate, search } = req.query;
    const filter = { user: req.user._id };

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
        filter.$or = [
            { ruleName: { $regex: search, $options: 'i' } },
            { ruleDescription: { $regex: search, $options: 'i' } },
        ];
    }

    try {
        const rules = await Rule.find(filter)
            .sort({ createdAt: -1 });

        res.status(200).json({
            rules: {
                count: rules.length,
                items: rules,
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /rules/:id
const getRule = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: `Rule with ID ${id} does not exist` });
    }

    try {
        const rule = await Rule.findOne({ _id: id, user: req.user._id });
        if (!rule) {
            return res.status(404).json({ error: `Rule with ID ${id} not found` });
        }
        res.status(200).json(rule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /rules
const createRule = async (req, res) => {
    const { ruleName, ruleDescription, expression, alertMessage, retriggerAfter } = req.body;

    // Basic validation
    if (!ruleName || !ruleDescription || !expression) {
        return res.status(400).json({ error: 'ruleName, ruleDescription and expression are required' });
    }

    try {
        const rule = await Rule.create({
            ruleName,
            ruleDescription,
            expression,
            alertMessage,
            retriggerAfter,
            user: req.user._id,
        });
        appEvents.emit('dataChanged'); // <-- Trigger evaluation!
        res.status(201).json(rule);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// POST /rules/bulk
const createRules = async (req, res) => {
    const { rules } = req.body;
    if (!Array.isArray(rules) || rules.length === 0) {
        return res.status(400).json({ error: 'No rules provided or invalid format' });
    }

    const valid = [];
    const invalid = [];

    rules.forEach((r, idx) => {
        const { ruleName, ruleDescription, expression } = r;
        const missing = [];
        if (!ruleName) missing.push('ruleName');
        if (!ruleDescription) missing.push('ruleDescription');
        if (!expression) missing.push('expression');
        if (missing.length) invalid.push({ index: idx, missing });
        else valid.push({ ...r, user: req.user._id });
    });

    if (invalid.length) {
        return res.status(400).json({ error: 'Some rules invalid', invalid });
    }

    try {
        const created = await Rule.insertMany(valid);
        appEvents.emit('dataChanged'); // <-- Trigger evaluation!
        res.status(201).json({ message: 'Rules created', created });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// PUT /rules/:id
const updateRule = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: `Rule with ID ${id} does not exist` });
    }

    const { ruleName, ruleDescription, expression, alertMessage, retriggerAfter } = req.body;
    if (!expression) {
        return res.status(400).json({ error: 'expression is required' });
    }

    try {
        const rule = await Rule.findOneAndUpdate(
            { _id: id, user: req.user._id },
            { ruleName, ruleDescription, expression, alertMessage, retriggerAfter },
            { new: true }
        );
        if (!rule) {
            return res.status(404).json({ error: `Rule with ID ${id} not found or not authorized` });
        }
        appEvents.emit('dataChanged'); // <-- Trigger evaluation!
        res.status(200).json(rule);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// DELETE /rules/:id
const deleteRule = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: `Rule with ID ${id} does not exist` });
    }

    try {
        const rule = await Rule.findOneAndDelete({ _id: id, user: req.user._id });
        if (!rule) {
            return res.status(404).json({ error: `Rule with ID ${id} not found or not authorized` });
        }
        res.status(200).json({ message: 'Rule deleted', rule });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const deleteRules = async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
        return res.status(400).json({ error: 'No IDs provided' });
    }
    const invalid = ids.filter(i => !mongoose.Types.ObjectId.isValid(i));
    if (invalid.length) {
        return res.status(400).json({ error: `Invalid IDs: ${invalid.join(', ')}` });
    }

    try {
        const result = await Rule.deleteMany({ _id: { $in: ids }, user: req.user._id });
        if (!result.deletedCount) {
            return res.status(404).json({ error: 'No rules deleted' });
        }
        res.status(200).json({ message: `Deleted ${result.deletedCount} rules` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH /rules/:id/arm
const armRule = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid rule ID' });
    }
    try {
        const rule = await Rule.findOne({ _id: id, user: req.user._id });
        if (!rule) return res.status(404).json({ error: 'Rule not found' });
        rule.isArmed = true;
        await rule.save();
        res.status(200).json({ message: 'Rule re-armed', rule });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH /rules/:id/disarm
const disarmRule = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid rule ID' });
    }
    try {
        const rule = await Rule.findOne({ _id: id, user: req.user._id });
        if (!rule) return res.status(404).json({ error: 'Rule not found' });

        rule.isArmed = false;
        await rule.save();

        res.status(200).json({ message: 'Rule disarmed', rule });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /rules/bulk-arm
const bulkArmRules = async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
        return res.status(400).json({ error: 'No IDs provided' });
    }

    const invalid = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalid.length) {
        return res.status(400).json({ error: `Invalid IDs: ${invalid.join(', ')}` });
    }

    try {
        const result = await Rule.updateMany(
            { _id: { $in: ids }, user: req.user._id },
            { $set: { isArmed: true } }
        );
        res.status(200).json({ message: `Armed ${result.modifiedCount} rule(s)` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /rules/bulk-disarm
const bulkDisarmRules = async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
        return res.status(400).json({ error: 'No IDs provided' });
    }

    const invalid = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalid.length) {
        return res.status(400).json({ error: `Invalid IDs: ${invalid.join(', ')}` });
    }

    try {
        const result = await Rule.updateMany(
            { _id: { $in: ids }, user: req.user._id },
            { $set: { isArmed: false } }
        );
        res.status(200).json({ message: `Disarmed ${result.modifiedCount} rule(s)` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
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
};
