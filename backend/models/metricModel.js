const mongoose = require('mongoose')

const Schema = mongoose.Schema

const MetricSchema = new Schema({
    metricName: {
        type: String,
        required: true
    }, 
    value : {
        type: Number,
        required: true
    },
},{timestamps: true})

module.exports = mongoose.model('Metric', MetricSchema);