const { Parser } = require('json2csv');
const js2xmlparser = require('js2xmlparser');
const mongoose = require('mongoose');

const convertToCSV = (data) => {
    try {
        const parser = new Parser();
        return parser.parse(data);
    } catch (err) {
        console.error('CSV conversion error:', err);
        return '';
    }
};

// Recursively sanitize nested objects for XML
const sanitizeObject = (obj) => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value instanceof Date) {
            result[key] = value.toISOString();
        } else if (Array.isArray(value)) {
            result[key] = value.map(sanitizeObject);
        } else if (
            typeof value === 'object' &&
            value !== null &&
            !(value instanceof mongoose.Types.ObjectId)
        ) {
            result[key] = sanitizeObject(value);
        } else if (value instanceof mongoose.Types.ObjectId || Buffer.isBuffer(value)) {
            result[key] = value.toString(); // fix ObjectId and Buffer
        } else {
            result[key] = value;
        }
    }
    return result;
};

const convertToXML = (data, rootName = 'items') => {
    try {
        const sanitized = Array.isArray(data) ? data.map(sanitizeObject) : sanitizeObject(data);
        return js2xmlparser.parse(rootName, sanitized);
    } catch (err) {
        console.error('XML conversion error:', err);
        return '<error>Failed to convert data to XML</error>';
    }
};

module.exports = { convertToCSV, convertToXML };
