const mongoose = require('mongoose');

const RuleBreachLogSchema = new mongoose.Schema({
    ruleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rule',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    triggeredAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('RuleBreachLog', RuleBreachLogSchema);
