const mongoose = require('mongoose');
const { Schema } = mongoose;

// Operand schema: metric, constant, or function (recursive)
const OperandSchema = new Schema({
    exprType: {
        type: String,
        enum: ['metric', 'constant', 'function'],
        required: true,
    },
    metric: {
        type: Schema.Types.ObjectId,
        ref: 'Metric',
    },
    value: {
        type: Number,
    },
    fn: {
        type: String, // e.g. 'abs', '+', '-', 'sum'
    },
    args: [{
        type: Schema.Types.Mixed, // recursive OperandSchema
    }]
}, { _id: false });

// Expression schema (recursive)
const ExpressionSchema = new Schema({
    nodeType: {
        type: String,
        enum: ['comparison', 'group', 'aggregator', 'ruleRef'],
        required: true,
    },

    // comparison
    left: OperandSchema,
    operator: {
        type: String,
        enum: [
            '==', '!=', '<', '<=', '>', '>=',
            'equals', 'not equals', 'less than',
            'greater than', 'lesser equals', 'greater equals'
        ],
    },
    right: OperandSchema,

    // group (logical operations)
    children: [{
        type: Schema.Types.Mixed, // ExpressionSchema (recursive)
    }],
    logicOp: {
        type: String,
        enum: ['AND', 'OR', 'XOR', 'NAND', 'NOR'],
    },

    // aggregator (cumulative logic)
    aggregator: {
        type: String,
        enum: ['ANY', 'ALL', 'AT_LEAST', 'AT_MOST', 'EXACTLY'],
    },
    threshold: {
        type: Number, // Only used for AT_LEAST, AT_MOST, EXACTLY
    },

    // rule reference
    ruleRef: {
        type: Schema.Types.ObjectId,
        ref: 'Rule',
    }
}, { _id: false });

// Rule schema
const RuleSchema = new Schema({
    ruleName: { type: String, required: true },
    ruleDescription: { type: String },
    expression: { type: ExpressionSchema, required: true },

    alertMessage: { type: String },
    isArmed: { type: Boolean, default: true },
    retriggerAfter: { type: String },
    lastTriggeredAt: { type: Date },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

RuleSchema.set('toJSON', { virtuals: true });
RuleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Rule', RuleSchema);
