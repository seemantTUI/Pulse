require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Metric = require('./models/metricModel');
const MetricLog = require('./models/metricLogModel');
const Rule = require('./models/ruleModel');
const RuleBreachLog = require('./models/ruleBreachLogModel');

const isValidObjectId = id => mongoose.Types.ObjectId.isValid(id);

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'seedData.json')));

        const userId = new mongoose.Types.ObjectId("665abc000000000000000001"); // your real user

        const validMetricIds = data.metrics?.filter(m => isValidObjectId(m._id)).map(m => new mongoose.Types.ObjectId(m._id)) || [];
        const validRuleIds = data.rules?.filter(r => isValidObjectId(r._id)).map(r => new mongoose.Types.ObjectId(r._id)) || [];

        console.log('🧹 Cleaning up existing data...');
        if (validMetricIds.length) await Metric.deleteMany({ _id: { $in: validMetricIds } });
        if (validRuleIds.length) await Rule.deleteMany({ _id: { $in: validRuleIds } });
        if (data.metriclogs?.length) await MetricLog.deleteMany({ metricId: { $in: validMetricIds } });
        if (data.rulebreachlogs?.length) await RuleBreachLog.deleteMany({ ruleId: { $in: validRuleIds } });

        console.log('📦 Inserting new metrics...');
        await Metric.insertMany(data.metrics.filter(m => isValidObjectId(m._id)).map(metric => ({
            ...metric,
            _id: new mongoose.Types.ObjectId(metric._id),
            user: userId,
            createdAt: new Date(metric.createdAt),
            updatedAt: new Date(metric.updatedAt),
        })));

        console.log('📦 Inserting new metric logs...');
        await MetricLog.insertMany(data.metriclogs.filter(log => isValidObjectId(log.metric)).map(log => ({
            metricId: new mongoose.Types.ObjectId(log.metric),
            user: userId,
            value: log.value,
            createdAt: new Date(log.createdAt),
        })));

        console.log('📦 Inserting new rules...');
        await Rule.insertMany(data.rules.filter(r => isValidObjectId(r._id) && isValidObjectId(r.metric)).map(rule => ({
            ...rule,
            _id: new mongoose.Types.ObjectId(rule._id),
            metric: new mongoose.Types.ObjectId(rule.metric),
            user: userId,
            createdAt: new Date(rule.createdAt),
            updatedAt: new Date(rule.updatedAt),
            lastTriggeredAt: rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt) : undefined,
        })));

        console.log('📦 Inserting new rule breach logs...');
        await RuleBreachLog.insertMany(data.rulebreachlogs.filter(log => isValidObjectId(log.ruleId)).map(log => ({
            ruleId: new mongoose.Types.ObjectId(log.ruleId),
            user: userId,
            value: log.value,
            triggeredAt: new Date(log.triggeredAt),
            createdAt: new Date(log.createdAt),
        })));

        console.log('✅ Seed completed successfully');
        process.exit();
    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
};

seed();
