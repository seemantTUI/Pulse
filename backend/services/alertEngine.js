const Rule = require('../models/ruleModel');
const Notification = require('../models/notificationModel');
const RuleBreachLog = require('../models/ruleBreachLogModel');
const Metric = require('../models/metricModel');
const { triggerNotification } = require('./notificationService');
const { parseDuration } = require('../utils/parseDuration');

const SUPPORTED_FUNCTIONS = {
  '+': (args) => args.reduce((a, b) => a + b),
  '-': (args) => args.reduce((a, b) => a - b),
  'abs': ([val]) => Math.abs(val),
};

const evaluateOperand = async (operand, metricsMap) => {
  if (operand.exprType === 'constant') {
    return operand.value;
  }

  if (operand.exprType === 'metric') {
    const metricId = operand.metric?.toString();
    const metricValue = metricsMap[metricId];
    if (metricValue == null) throw new Error(`Metric not found: ${metricId}`);
    return metricValue;
  }

  if (operand.exprType === 'function') {
    const fn = SUPPORTED_FUNCTIONS[operand.fn];
    if (!fn) throw new Error(`Unsupported function: ${operand.fn}`);
    const args = await Promise.all(operand.args.map(arg => evaluateOperand(arg, metricsMap)));
    return fn(args);
  }

  throw new Error(`Unknown operand type: ${operand.exprType}`);
};

const evaluateExpression = async (expr, metricsMap) => {
  switch (expr.nodeType) {
    case 'comparison': {
      const left = await evaluateOperand(expr.left, metricsMap);
      const right = await evaluateOperand(expr.right, metricsMap);
      switch (expr.operator) {
        case '==':
        case 'equals': return left === right;
        case '!=':
        case 'not equals': return left !== right;
        case '<':
        case 'less than': return left < right;
        case '<=':
        case 'lesser equals': return left <= right;
        case '>':
        case 'greater than': return left > right;
        case '>=':
        case 'greater equals': return left >= right;
        default:
          throw new Error(`Unsupported operator: ${expr.operator}`);
      }
    }

    case 'group': {
      const results = await Promise.all(expr.children.map(child => evaluateExpression(child, metricsMap)));
      switch (expr.logicOp) {
        case 'AND': return results.every(Boolean);
        case 'OR': return results.some(Boolean);
        case 'XOR': return results.filter(Boolean).length === 1;
        case 'NAND': return !results.every(Boolean);
        case 'NOR': return !results.some(Boolean);
        default:
          throw new Error(`Unsupported logicOp: ${expr.logicOp}`);
      }
    }

    case 'aggregator': {
      const results = await Promise.all(expr.children.map(child => evaluateExpression(child, metricsMap)));
      const count = results.filter(Boolean).length;
      switch (expr.aggregator) {
        case 'ALL': return count === results.length;
        case 'ANY': return count > 0;
        case 'AT_LEAST': return count >= expr.threshold;
        case 'AT_MOST': return count <= expr.threshold;
        case 'EXACTLY': return count === expr.threshold;
        default:
          throw new Error(`Unsupported aggregator: ${expr.aggregator}`);
      }
    }

    default:
      throw new Error(`Unsupported nodeType: ${expr.nodeType}`);
  }
};

const extractMetricIds = (expr, ids = new Set()) => {
  if (!expr) return ids;

  if (expr.nodeType === 'comparison') {
    [expr.left, expr.right].forEach(op => {
      if (op?.exprType === 'metric' && op.metric) {
        ids.add(op.metric.toString());
      }
      if (op?.exprType === 'function') {
        op.args?.forEach(arg => extractMetricIds(arg, ids));
      }
    });
  } else if (expr.nodeType === 'group' || expr.nodeType === 'aggregator') {
    expr.children?.forEach(child => extractMetricIds(child, ids));
  }

  return ids;
};

const evaluateRules = async () => {
  console.log("🔄 Starting rule evaluation...");

  try {
    const rules = await Rule.find().populate('user', '_id');

    for (const rule of rules) {
      try {
        const metricIds = Array.from(extractMetricIds(rule.expression));
        const metrics = await Metric.find({ _id: { $in: metricIds } });
        const metricsMap = Object.fromEntries(metrics.map(m => [m._id.toString(), m.value]));

        const breach = await evaluateExpression(rule.expression, metricsMap);

        const now = new Date();
        const lastTime = rule.lastTriggeredAt || new Date(0);
        const waitTime = parseDuration(rule.retriggerAfter || '0s');
        const enoughTimePassed = now - new Date(lastTime) > waitTime;
        const shouldTrigger = rule.isArmed || enoughTimePassed;

        if (breach && shouldTrigger) {
          await RuleBreachLog.create({
            ruleId: rule._id,
            user: rule.user?._id,
            triggeredAt: now,
          });

          const notification = new Notification({
            ruleId: rule._id,
            user: rule.user?._id,
            message: rule.alertMessage || `Alert! Rule "${rule.ruleName}" was breached.`,
          });

          await notification.save();
          await triggerNotification(rule, null); // Metric value not relevant anymore

          //rule.isArmed = false;
          rule.lastTriggeredAt = now;
          await rule.save();

          console.log(`🚨 Notification triggered for rule: ${rule.ruleName}`);
        } else if (breach) {
          console.log(`⚠️ Rule breached but not armed: ${rule.ruleName}`);
        }

      } catch (innerError) {
        console.error(`❌ Error while evaluating rule "${rule.ruleName}" (ID: ${rule._id}):`, innerError.message);
      }
    }

    console.log("✅ Rule evaluation completed.");
  } catch (error) {
    console.error("❌ Error during rule evaluation process:", error.message);
  }
};

module.exports = { evaluateRules };
