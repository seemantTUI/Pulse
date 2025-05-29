const Metric = require('../models/metricModel')
const mongoose = require('mongoose')


const getMetrics = async (req, res) =>{
    try {
        const metrics = await Metric.find({}).sort({createdAt: -1})
        const count = metrics.length;

        res.status(200).json({
            metrics: {
                count,
                items: metrics,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMetric = async(req, res) => {
    const { id } = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({ error: `Metric with ${id} does not exist` });
    }
    const metric = await Metric.findById(id)
    if(!metric)   {
        return res.status(404).json({ error: `Metric with ${id} does not exist` });
    }
 
    res.status(200).json(metric);
};

const createMetric = async (req, res) => {
    const { metricName, value} = req.body
            
    let missingFields = []
    if(!metricName){ missingFields.push(metricName)}
    if(!value){ missingFields.push(value)}
    if(missingFields.length > 0)    {
        return req.status(400).json ({error: 'Please fill in all the fields', emptyFields })
    }
    try {
        const metric  =  await Metric.create({metricName, value})
        res.status(201).json(metric);
    } catch (error){
        res.status(400).json({ error: error.message })
    }

};

const createMetrics = async (req, res) => {
    const { metrics } = req.body; 

    if (!Array.isArray(metrics) || metrics.length === 0) {
        return res.status(400).json({ error: 'No metrics provided or invalid format' });
    }

    const invalidMetrics = [];
    const validMetrics = [];

    // Validate each rule in the array
    metrics.forEach((metric, index) => {
        const {metricName, value } = metric;
        const missingFields = [];

        if (!metricName) missingFields.push('metricName');
        if (!value) missingFields.push('value');
    
        if (missingFields.length > 0) {
            invalidMetrics.push({ index, missingFields });
        } else {
            validMetrics.push(metric);
        }
    });

    if (invalidMetrics.length > 0) {
        return res.status(400).json({
            error: 'Some metrics are missing required fields',
            invalidMetrics,
        });
    }

    try {
        const createdMetrics = await Metric.insertMany(validMetrics);
        res.status(201).json({ message: 'Metrics created successfully', createdMetrics });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


const updateMetric = async (req, res) => {
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({ error: `Metric with ${id} does not exist` });
    }
    try {
        const metric = await Metric.findOneAndUpdate({_id: id}, {...req.body})
        if (!metric){
            return res.status(404).json({ error: `Metric with ${id} does not exist` });
        }
        return res.status(200).json(metric)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
    
    
};

const deleteMetric = async (req, res) => {
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({ error: `Metric with ${id} does not exist` });
    }
    try {
        const metric = await Metric.findOneAndDelete({_id: id})
        if (!metric){
        return res.status(404).json({ error: `Metric with ${id} does not exist` });
    }
    return res.status(200).json(metric)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
    
    
};

const deleteMetrics = async (req, res) => {
    const { ids } = req.body; // Assume `ids` is an array of rule IDs to be deleted

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No IDs provided or invalid format' });
    }

    // Check if all IDs are valid
    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
        return res.status(400).json({ error: `Invalid IDs: ${invalidIds.join(', ')}` });
    }

    try {
        const result = await Metric.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'No metrics found to delete' });
        }
        return res.status(200).json({ message: `Deleted ${result.deletedCount} metrics successfully` });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
    
};


module.exports = {
    getMetrics,
    getMetric,
    createMetric,
    createMetrics,
    updateMetric,
    deleteMetric,
    deleteMetrics
};