'use client';

import React, { useState } from 'react';
import { Box, Button, Select, MenuItem, Typography } from '@mui/material';
import ComparisonNode from './ComparisonNode';
import GroupNode from './GroupNode';
import AggregatorNode from './AggregatorNode';
import { stringifyExpression } from '../stringifyExpression';

export default function ExpressionBuilder({ node, onChange, metrics, readOnly = false }: any) {
    const [showPreview, setShowPreview] = useState(false);

    const handleNodeTypeChange = (type: string) => {
        let base;
        if (type === 'comparison') {
            base = {
                nodeType: 'comparison',
                operator: '>',
                left: { exprType: 'metric', metric: '' },
                right: { exprType: 'constant', value: 0 }
            };
        } else if (type === 'group') {
            base = {
                nodeType: 'group',
                logicOp: 'AND',
                children: []
            };
        } else if (type === 'aggregator') {
            base = {
                nodeType: 'aggregator',
                aggregator: 'ANY',
                metrics: [],
                operator: '>',
                compareTo: { exprType: 'constant', value: 0 }
            };
        }
        onChange(base);
    };

    return (
        <Box mt={2} p={2} border="1px solid #ccc" borderRadius={1}>
            <Box display="flex" gap={2} alignItems="center" mb={2}>
                <Typography variant="subtitle2">Expression Type:</Typography>
                <Select
                    value={node?.nodeType || ''}
                    onChange={(e) => handleNodeTypeChange(e.target.value)}
                    disabled={readOnly}
                    size="small"
                >
                    <MenuItem value="comparison">Comparison</MenuItem>
                    <MenuItem value="group">Group</MenuItem>
                    <MenuItem value="aggregator">Aggregator</MenuItem>
                </Select>
            </Box>

            {node?.nodeType === 'comparison' && (
                <ComparisonNode node={node} onChange={onChange} metrics={metrics} readOnly={readOnly} />
            )}

            {node?.nodeType === 'group' && (
                <GroupNode node={node} onChange={onChange} metrics={metrics} readOnly={readOnly} />
            )}

            {node?.nodeType === 'aggregator' && (
                <AggregatorNode node={node} onChange={onChange} metrics={metrics} readOnly={readOnly} />
            )}

            <Box mt={2}>
                <Button
                    variant="outlined"
                    onClick={() => setShowPreview(!showPreview)}
                    size="small"
                >
                    {showPreview ? 'Hide' : 'Preview'} Expression
                </Button>

                {showPreview && (
                    <Typography mt={2} fontStyle="italic" color="text.secondary">
                        {stringifyExpression(node, metrics)}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
