type Operand = {
    exprType: 'constant' | 'metric' | 'function';
    value?: number;
    metric?: string;
    fn?: string;
    args?: Operand[];
};

type ExpressionNode = {
    nodeType: 'comparison' | 'group' | 'aggregator';
    left?: Operand;
    right?: Operand;
    operator?: string;
    logicOp?: string;
    children?: ExpressionNode[];
    metrics?: string[];
    compareTo?: Operand;
    aggregator?: string;
    exactCount?: number; // 🔥 new field
};

type Metric = { _id: string; metricName: string };

function getMetricName(id: string, metrics: Metric[]): string {
    return metrics.find(m => m._id === id)?.metricName || id;
}

function stringifyOperand(op: Operand | undefined, metrics: Metric[]): string {
    if (!op) return '?';
    if (op.exprType === 'constant') return String(op.value);
    if (op.exprType === 'metric') return getMetricName(op.metric || '', metrics);
    if (op.exprType === 'function') {
        const args = (op.args || []).map((arg: Operand) => stringifyOperand(arg, metrics)).join(', ');
        return `${op.fn}(${args})`;
    }
    return '?';
}

export function stringifyExpression(node: ExpressionNode, metrics: Metric[]): string {
    if (!node) return '';

    switch (node.nodeType) {
        case 'comparison':
            return `${stringifyOperand(node.left, metrics)} ${node.operator} ${stringifyOperand(node.right, metrics)}`;

        case 'group':
            return (node.children || [])
                .map((child: ExpressionNode) => `(${stringifyExpression(child, metrics)})`)
                .join(` ${node.logicOp} `);

        case 'aggregator': {
            const metricNames = (node.metrics || []).map((id: string) => getMetricName(id, metrics));
            const metricList = metricNames.length ? `[${metricNames.join(', ')}]` : '[ALL]';
            const comparePart = `${node.operator} ${stringifyOperand(node.compareTo, metrics)}`;

            if (node.aggregator === 'EXACTLY') {
                return `Exactly ${node.exactCount ?? '?'} of ${metricList} must be ${comparePart}`;
            }

            const aggLabelMap: Record<string, string> = {
                ANY: 'Any of',
                ALL: 'All of',
                AT_LEAST: 'At least one of',
                AT_MOST: 'At most none of',
            };

            const label = aggLabelMap[node.aggregator || ''] || node.aggregator;
            return `${label} ${metricList} must be ${comparePart}`;
        }

        default:
            return '';
    }
}
