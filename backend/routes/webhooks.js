const express = require('express');
const router = express.Router();
const Metric = require('../models/metricModel');
const MetricLog = require('../models/metricLogModel');

router.post('/push', async (req, res) => {
  try {
    const { name, value } = req.body;

    if (!name || value === undefined) {
      return res.status(400).json({ error: 'Metric name and value are required' });
    }

    let metric = await Metric.findOne({ metricName: name });

    if (!metric) {
      // Create new metric
      metric = await Metric.create({
        metricName: name,
        value,
      });
    } else {
      // Update value
      metric.value = value;
      await metric.save();
    }

    // Log every push (assuming MetricLog has metricId and value)
    await MetricLog.create({
      metricId: metric._id,
      value,
    });

    res.status(201).json({
      message: 'Metric pushed and logged successfully',
      metric,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
