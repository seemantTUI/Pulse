const express = require('express');
const router = express.Router();
const Metric = require('../models/metricModel');
const MetricLog = require('../models/metricLogModel');

// Helper: create a single metric
async function createMetric({ name, value }) {
  if (!name || value === undefined) {
    throw new Error('Metric name and value are required');
  }
  const existing = await Metric.findOne({ metricName: name });
  if (existing) {
    throw new Error(`Metric with name "${name}" already exists`);
  }
  const metric = await Metric.create({ metricName: name, value });
  await MetricLog.create({ metricId: metric._id, value });
  return metric;
}

// CREATE: Single or multiple
router.post('/metric/create', async (req, res) => {
  try {
    const { name, value, metrics } = req.body;

    let results = [];

    if (Array.isArray(metrics)) {
      for (const m of metrics) {
        try {
          const metric = await createMetric(m);
          results.push({ success: true, metric });
        } catch (err) {
          results.push({ success: false, error: err.message, input: m });
        }
      }
      // Success if at least one created
      const status = results.some(r => r.success) ? 201 : 400;
      return res.status(status).json({ results });
    } else {
      // Single metric (name & value in body)
      const metric = await createMetric({ name, value });
      return res.status(201).json({ message: 'Metric created and logged', metric });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: update a single metric by id or name
async function updateMetric({ id, name, value, newName }) {
  if (!id && !name) throw new Error('Either metric ID or name must be provided');
  const query = id ? { _id: id } : { metricName: name };
  const metric = await Metric.findOne(query);
  if (!metric) throw new Error('Metric not found');

  let valueChanged = false;
  if (newName) metric.metricName = newName;
  if (value !== undefined) {
    metric.value = value;
    valueChanged = true;
  }
  await metric.save();
  if (valueChanged) {
    await MetricLog.create({ metricId: metric._id, value });
  }
  return metric;
}

// UPDATE: Single or multiple
router.patch('/metric/update', async (req, res) => {
  try {
    const updates = Array.isArray(req.body) ? req.body : [req.body];

    let results = [];

    for (const update of updates) {
      try {
        const metric = await updateMetric(update);
        results.push({ success: true, metric });
      } catch (err) {
        results.push({ success: false, error: err.message, input: update });
      }
    }

    // Success if at least one updated
    const status = results.some(r => r.success) ? 200 : 400;
    return res.status(status).json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
