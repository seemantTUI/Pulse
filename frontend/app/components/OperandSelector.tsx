// components/OperandSelector.tsx
import React from 'react';
import { Box, MenuItem, Select, TextField, IconButton, Typography } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

export default function OperandSelector({ operand, onChange, metrics, readOnly }: any) {
    const handleExprTypeChange = (e: any) => {
        const type = e.target.value;
        if (type === 'metric') {
            onChange({ exprType: 'metric', metric: '' });
        } else if (type === 'constant') {
            onChange({ exprType: 'constant', value: 0 });
        } else {
            onChange({ exprType: 'function', fn: 'abs', args: [] });
        }
    };

    const functionOptions = ['abs', 'sum', 'diff'];

    const handleFunctionChange = (e: any) => {
        onChange({ ...operand, fn: e.target.value, args: [] });
    };

    const updateArg = (index: number, newArg: any) => {
        const updatedArgs = [...(operand.args || [])];
        updatedArgs[index] = newArg;
        onChange({ ...operand, args: updatedArgs });
    };

    const addArg = () => {
        const updatedArgs = [...(operand.args || []), { exprType: 'metric', metric: '' }];
        onChange({ ...operand, args: updatedArgs });
    };

    const removeArg = (index: number) => {
        const updatedArgs = operand.args.filter((_: any, i: number) => i !== index);
        onChange({ ...operand, args: updatedArgs });
    };

    if (!operand) return null;

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Select
                value={operand.exprType}
                onChange={handleExprTypeChange}
                disabled={readOnly}
                size="small"
            >
                <MenuItem value="metric">Metric</MenuItem>
                <MenuItem value="constant">Constant</MenuItem>
                <MenuItem value="function">Function</MenuItem>
            </Select>

            {operand.exprType === 'metric' && (
                <Select
                    value={operand.metric || ''}
                    onChange={(e) => onChange({ ...operand, metric: e.target.value })}
                    disabled={readOnly}
                    size="small"
                >
                    {metrics.map((m: any) => (
                        <MenuItem key={m._id} value={m._id}>{m.metricName}</MenuItem>
                    ))}
                </Select>
            )}

            {operand.exprType === 'constant' && (
                <TextField
                    type="number"
                    value={operand.value || 0}
                    onChange={(e) => onChange({ ...operand, value: parseFloat(e.target.value) })}
                    disabled={readOnly}
                    size="small"
                />
            )}

            {operand.exprType === 'function' && (
                <Box display="flex" flexDirection="column" gap={1}>
                    <Select
                        value={operand.fn || 'abs'}
                        onChange={handleFunctionChange}
                        disabled={readOnly}
                        size="small"
                    >
                        {functionOptions.map(fn => (
                            <MenuItem key={fn} value={fn}>{fn}</MenuItem>
                        ))}
                    </Select>

                    {(operand.args || []).map((arg: any, index: number) => (
                        <Box key={index} display="flex" gap={1} alignItems="center">
                            <OperandSelector
                                operand={arg}
                                onChange={(updated: any) => updateArg(index, updated)}
                                metrics={metrics}
                                readOnly={readOnly}
                            />
                            {!readOnly && (
                                <IconButton onClick={() => removeArg(index)} size="small">
                                    <Delete fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                    ))}

                    {!readOnly && (
                        <IconButton onClick={addArg} size="small">
                            <Add fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            )}
        </Box>
    );
}