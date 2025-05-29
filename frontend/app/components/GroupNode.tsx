import React from 'react';
import { Box, Select, MenuItem, IconButton, Typography } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import ExpressionBuilder from './ExpressionBuilder';

export default function GroupNode({ node, onChange, metrics, readOnly }: any) {
    const handleLogicChange = (e: any) => {
        onChange({ ...node, logicOp: e.target.value });
    };

    const addChild = () => {
        const newChild = {
            nodeType: 'comparison',
            operator: '>',
            left: { exprType: 'metric', metric: '' },
            right: { exprType: 'constant', value: 0 }
        };
        onChange({ ...node, children: [...node.children, newChild] });
    };

    const updateChild = (index: number, updated: any) => {
        const updatedChildren = [...node.children];
        updatedChildren[index] = updated;
        onChange({ ...node, children: updatedChildren });
    };

    const removeChild = (index: number) => {
        const updatedChildren = node.children.filter((_: any, i: number) => i !== index);
        onChange({ ...node, children: updatedChildren });
    };

    return (
        <Box mt={2} pl={2} borderLeft="3px solid #ccc">
            <Box display="flex" gap={2} alignItems="center" mb={1}>
                <Typography variant="subtitle2">Group Logic:</Typography>
                <Select
                    value={node.logicOp}
                    onChange={handleLogicChange}
                    disabled={readOnly}
                    size="small"
                >
                    <MenuItem value="AND">AND</MenuItem>
                    <MenuItem value="OR">OR</MenuItem>
                    <MenuItem value="XOR">XOR</MenuItem>
                    <MenuItem value="NAND">NAND</MenuItem>
                    <MenuItem value="NOR">NOR</MenuItem>
                </Select>
            </Box>

            {node.children.map((child: any, index: number) => (
                <Box key={index} mt={index > 0 ? 2 : 0}>
                    {index > 0 && (
                        <Typography
                            fontWeight={500}
                            fontSize={12}
                            color="text.secondary"
                            mb={1}
                            ml={1}
                        >
                            {node.logicOp}
                        </Typography>
                    )}
                    <Box display="flex" alignItems="center" gap={1}>
                        <ExpressionBuilder
                            node={child}
                            onChange={(updated: any) => updateChild(index, updated)}
                            metrics={metrics}
                            readOnly={readOnly}
                        />
                        {!readOnly && (
                            <IconButton onClick={() => removeChild(index)} size="small">
                                <Delete fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                </Box>
            ))}

            {!readOnly && (
                <IconButton onClick={addChild} size="small" sx={{ mt: 1 }}>
                    <Add fontSize="small" />
                </IconButton>
            )}
        </Box>
    );
}
