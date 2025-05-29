const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MetricLogSchema = new Schema({
    metricId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Metric',
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('MetricLog', MetricLogSchema);
