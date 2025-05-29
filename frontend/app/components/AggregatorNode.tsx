import React from 'react';
import {
    Box,
    Typography,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    OutlinedInput,
    TextField
} from '@mui/material';
import OperandSelector from './OperandSelector';

const comparisonOperators = ['==', '!=', '<', '<=', '>', '>='];

export default function AggregatorNode({ node, onChange, metrics, readOnly }: any) {
    const handleAggregatorChange = (e: any) => {
        const agg = e.target.value;
        const updated = { ...node, aggregator: agg };
        if (agg !== 'EXACTLY') {
            delete updated.exactCount;
        }
        onChange(updated);
    };

    const handleExactCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...node, exactCount: parseInt(e.target.value, 10) || 0 });
    };

    const handleMetricChange = (e: any) => {
        onChange({ ...node, metrics: e.target.value });
    };

    const handleOperatorChange = (e: any) => {
        onChange({ ...node, operator: e.target.value });
    };

    const updateCompareTo = (newVal: any) => {
        onChange({ ...node, compareTo: newVal });
    };

    return (
        <Box mt={2} pl={2} borderLeft="3px solid #ccc">
            {/* Aggregation Type */}
            <Box display="flex" gap={2} alignItems="center" mb={2}>
                <Typography variant="subtitle2">Aggregation Type:</Typography>
                <Select
                    value={node.aggregator}
                    onChange={handleAggregatorChange}
                    disabled={readOnly}
                    size="small"
                >
                    <MenuItem value="ANY">Any</MenuItem>
                    <MenuItem value="ALL">All</MenuItem>
                    <MenuItem value="AT_LEAST">At Least One</MenuItem>
                    <MenuItem value="AT_MOST">At Most None</MenuItem>
                    <MenuItem value="EXACTLY">Exactly</MenuItem>
                </Select>

                {node.aggregator === 'EXACTLY' && (
                    <TextField
                        label="Count"
                        type="number"
                        size="small"
                        value={node.exactCount || ''}
                        onChange={handleExactCountChange}
                        disabled={readOnly}
                        inputProps={{ min: 0 }}
                        sx={{ width: 100 }}
                    />
                )}
            </Box>

            {/* Metric Selection */}
            <Box mb={2}>
                <Typography variant="subtitle2" mb={1}>Apply To Metrics:</Typography>
                <Select
                    multiple
                    value={node.metrics || []}
                    onChange={handleMetricChange}
                    disabled={readOnly}
                    size="small"
                    input={<OutlinedInput />}
                    renderValue={(selected) =>
                        selected.length === 0
                            ? 'All metrics (default)'
                            : metrics
                                .filter((m: any) => selected.includes(m._id))
                                .map((m: any) => m.metricName)
                                .join(', ')
                    }
                    sx={{ minWidth: 300 }}
                >
                    {metrics.map((metric: any) => (
                        <MenuItem key={metric._id} value={metric._id}>
                            <Checkbox checked={node.metrics?.includes(metric._id)} />
                            <ListItemText primary={metric.metricName} />
                        </MenuItem>
                    ))}
                </Select>

                {(!node.metrics || node.metrics.length === 0) && (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                        No metrics selected — will apply to <strong>all available metrics</strong>.
                    </Typography>
                )}
            </Box>

            {/* Comparison Clause */}
            <Box display="flex" alignItems="center" gap={2}>
                <Typography>Each metric</Typography>
                <Select
                    value={node.operator || '>'}
                    onChange={handleOperatorChange}
                    disabled={readOnly}
                    size="small"
                >
                    {comparisonOperators.map(op => (
                        <MenuItem key={op} value={op}>{op}</MenuItem>
                    ))}
                </Select>
                <OperandSelector
                    operand={node.compareTo || { exprType: 'constant', value: 0 }}
                    onChange={updateCompareTo}
                    metrics={metrics}
                    readOnly={readOnly}
                    allowConstants={true}
                />
            </Box>
        </Box>
    );
}
