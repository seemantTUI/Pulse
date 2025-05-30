const RuleBreachLog = require('../models/ruleBreachLogModel');

const getRuleBreachLogs = async (req, res) => {
    try {
        const { ruleId } = req.query;

        const query = { user: req.user._id };

        if (ruleId) {
            query.ruleId = ruleId;
        }

        const logs = await RuleBreachLog.find(query)
            .populate('ruleId', 'ruleName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: logs.length,
            items: logs,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRuleBreachLogsByRuleId = async (req, res) => {
    try {
        const { ruleId } = req.params;

        if (!ruleId) {
            return res.status(400).json({ error: 'ruleId is required in params.' });
        }

        const query = { user: req.user._id, ruleId };

        // Only last 24 hours:
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        query.triggeredAt = { $gte: twentyFourHoursAgo };

        const logs = await RuleBreachLog.find(query)
            .sort({ triggeredAt: 1 }); // sort by time ascending

        res.status(200).json({
            count: logs.length,
            items: logs,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getRuleBreachLogs,
    getRuleBreachLogsByRuleId
};
