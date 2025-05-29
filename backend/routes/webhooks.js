const express = require('express');
const router = express.Router();
const Metric = require('../models/metricModel');
const MetricLog = require('../models/metricLogModel');
const protect = require('../middleware/authMiddleware'); // use your existing middleware

router.post('/push', protect, async (req, res) => {
  try {
    const { name, value } = req.body;

    if (!name || value === undefined) {
      return res.status(400).json({ error: 'Metric name and value are required' });
    }

    const userId = req.user._id;

    let metric = await Metric.findOne({ metricName: name, user: userId });

    if (!metric) {
      metric = await Metric.create({
        metricName: name,
        value,
        user: userId,
      });
    } else {
      metric.value = value;
      await metric.save();
    }

    await MetricLog.create({
      metricId: metric._id,
      value,
      user: userId,
      createdAt: new Date(),
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
