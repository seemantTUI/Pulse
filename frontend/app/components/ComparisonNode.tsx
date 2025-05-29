import React from 'react';
import { Box, Select, MenuItem } from '@mui/material';
import OperandSelector from './OperandSelector';

const operators = ['==', '!=', '<', '<=', '>', '>='];

export default function ComparisonNode({ node, onChange, metrics, readOnly }: any) {
    const updateLeft = (val: any) => onChange({ ...node, left: val });
    const updateRight = (val: any) => onChange({ ...node, right: val });
    const handleOperatorChange = (e: any) => onChange({ ...node, operator: e.target.value });

    return (
        <Box display="flex" alignItems="center" gap={2} mt={2}>
            <OperandSelector
                operand={node.left}
                onChange={updateLeft}
                metrics={metrics}
                readOnly={readOnly}
                allowConstants={false} // 🚫 Disallow constants on the left
            />
            <Select value={node.operator} onChange={handleOperatorChange} disabled={readOnly}>
                {operators.map(op => (
                    <MenuItem key={op} value={op}>{op}</MenuItem>
                ))}
            </Select>
            <OperandSelector
                operand={node.right}
                onChange={updateRight}
                metrics={metrics}
                readOnly={readOnly}
                allowConstants={true}
            />
        </Box>
    );
}
