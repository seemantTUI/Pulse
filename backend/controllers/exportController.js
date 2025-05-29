const Rule = require('../models/ruleModel');
const Metric = require('../models/metricModel');
const Notification = require('../models/notificationModel');
const MetricLog = require('../models/metricLogModel');
const RuleBreachLog = require('../models/ruleBreachLogModel');
const { convertToCSV, convertToXML } = require('../utils/formatter');

const modelMap = {
    rules: Rule,
    metrics: Metric,
    notifications: Notification,
    metricLogs: MetricLog,
    ruleBreachLogs: RuleBreachLog,
};

// Clean for export: remove __v, and rename _id to id, but keep expression as-is for rules
const cleanForExport = (type, records) => {
    return records.map(({ __v, _id, user, ...rest }) => {
        const base = {
            id: _id.toString(), // always keep ID
            ...rest,
        };

        // Keep user field only for types that require scoping
        if (type !== 'metrics' && type !== 'metricLogs') {
            base.user = user;
        }

        return base;
    });
};

const exportData = async (req, res) => {
    const { type, format = 'json' } = req.query;

    if (!modelMap[type]) {
        return res.status(400).json({ error: 'Invalid export type' });
    }

    try {
        const isScoped = !(type === 'metrics' || type === 'metricLogs');
        const query = isScoped ? { user: req.user._id } : {};

        const rawData = await modelMap[type].find(query).lean();
        const data = cleanForExport(type, rawData);

        let content;
        let mime;
        if (format === 'json') {
            content = JSON.stringify(data, null, 2);
            mime = 'application/json';
        } else if (format === 'csv') {
            content = convertToCSV(data);
            mime = 'text/csv';
        } else if (format === 'xml') {
            content = convertToXML(data, type);
            mime = 'application/xml';
        } else {
            return res.status(400).json({ error: 'Unsupported format' });
        }

        res.setHeader('Content-Disposition', `attachment; filename=${type}.${format}`);
        res.setHeader('Content-Type', mime);
        res.send(content);
    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { exportData };
