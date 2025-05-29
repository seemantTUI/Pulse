const MetricLog = require('../models/metricLogModel');

const getMetricLogs = async (req, res) => {
    try {
        const { metricId } = req.params;

        if (!metricId) {
            return res.status(400).json({ error: 'metricId is required in the route params.' });
        }

        const logs = await MetricLog.find({ metricId }).sort({ createdAt: -1 });

        res.status(200).json({
            count: logs.length,
            items: logs,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getMetricLogs,
};
