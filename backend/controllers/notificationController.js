const Notification = require('../models/notificationModel');

const getNotifications = async (req, res) => {
    try {
        // Populate the associated rule
        const notifications = await Notification.find({user: req.user._id})
            .populate('ruleId', 'ruleName') // Populate only the `ruleName` field of the associated rule
            .sort({ createdAt: -1 });
        const count = notifications.length;

        res.status(200).json({
            notifications: {
                count,
                items: notifications,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getNotifications };
