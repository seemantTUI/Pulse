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

module.exports = {
    getRuleBreachLogs,
};
