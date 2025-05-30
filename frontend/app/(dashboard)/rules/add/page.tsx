'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Card,
    CardContent,
    useTheme,
} from '@mui/material';
import ExpressionBuilder from '../../../components/ExpressionBuilder';
import useRulesData from '../../../hooks/useRulesData';
import useMetricsData from '../../../hooks/useMetricsData';

export default function AddEditRulePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const copyFrom = searchParams.get('copyFrom');
    const readOnly = searchParams.get('view_only') === 'true';

    const { data: session, status } = useSession();
    const accessToken = session?.accessToken;

    const { getRuleById } = useRulesData();
    const { rows: metrics } = useMetricsData();

    const [ruleName, setRuleName] = useState('');
    const [ruleDesc, setRuleDesc] = useState('');
    const [expression, setExpression] = useState<any>({});
    const [alertMessage, setAlertMessage] = useState('Alert! Rule has been breached.');
    const [retriggerDays, setRetriggerDays] = useState<number>(0);
    const [retriggerHours, setRetriggerHours] = useState<number>(0);
    const [retriggerMinutes, setRetriggerMinutes] = useState<number>(30);
    const [error, setError] = useState<string | null>(null);

    const theme = useTheme();
    const cardBgColor = theme.palette.mode === 'dark' ? '#1e1e1e' : '#f9f9f9';

    useEffect(() => {
        const sourceId = id || copyFrom;
        if (!sourceId || !accessToken) return;

        (async () => {
            const data = await getRuleById(sourceId);
            if (!data) return;

            const name = data.ruleName || '';
            setRuleName(copyFrom ? `${name} (Copy)` : name);
            setRuleDesc(data.ruleDescription || '');
            setExpression(data.expression || {});
            setAlertMessage(data.alertMessage || `Alert! ${name} has been reached.`);

            const match = (data.retriggerAfter || '').match(/(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?/);
            if (match) {
                setRetriggerDays(Number(match[1] || 0));
                setRetriggerHours(Number(match[2] || 0));
                setRetriggerMinutes(Number(match[3] || 0));
            }
        })();
    }, [id, copyFrom, accessToken, getRuleById]);

    const buildRetriggerAfter = () => {
        let result = '';
        if (retriggerDays) result += `${retriggerDays}d`;
        if (retriggerHours) result += `${retriggerHours}h`;
        if (retriggerMinutes) result += `${retriggerMinutes}m`;
        return result || '30m';
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!accessToken) {
            setError('Not authenticated.');
            return;
        }

        if (!expression || !expression.nodeType) {
            setError('Expression is required.');
            return;
        }

        const payload = {
            ruleName,
            ruleDescription: ruleDesc,
            expression,
            alertMessage,
            retriggerAfter: buildRetriggerAfter(),
        };

        const url = id
            ? `${process.env.NEXT_PUBLIC_API_URL}/rules/${id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/rules`;

        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                router.push('/rules');
            } else {
                const err = await res.json();
                setError(err.error || 'Failed to save rule');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        }
    };

    return (
        <Box px={4} py={4}>
            <Card sx={{ maxWidth: 800, width: '100%', background: cardBgColor, boxShadow: 3 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        {id ? 'Edit Rule' : copyFrom ? 'Copy Rule' : 'New Rule'}
                    </Typography>
                    <Box
                        component="form"
                        onSubmit={readOnly ? (e) => e.preventDefault() : handleSubmit}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            mt: 1,
                            maxWidth: 400, // limit width for scroll behavior
                        }}
                    >
                        {/* Rule Name */}
                        <TextField
                            sx={{ width: 320 }}
                            label="Rule Name"
                            value={ruleName}
                            onChange={(e) => setRuleName(e.target.value)}
                            disabled={readOnly}
                            required
                            margin="normal"
                        />
                        {/* Description as textarea */}
                        <TextField
                            sx={{
                                '& .MuiInputBase-root': {
                                    overflow: 'auto',
                                },
                            }}
                            label="Description"
                            value={ruleDesc}
                            onChange={(e) => setRuleDesc(e.target.value)}
                            disabled={readOnly}
                            margin="normal"
                            multiline
                            minRows={2}
                            maxRows={6}
                            inputProps={{
                                style: { resize: 'vertical', maxHeight: 160, overflow: 'auto' }
                            }}
                        />

                        <Typography variant="subtitle1" mt={2}>
                            Expression
                        </Typography>
                        <Box mt={2} mb={4}>
                            <ExpressionBuilder
                                node={expression}
                                onChange={setExpression}
                                metrics={metrics}
                                readOnly={readOnly}
                            />
                        </Box>

                        {/* Alert message as textarea */}
                        <TextField
                            sx={{
                                '& .MuiInputBase-root': {
                                    overflow: 'auto',
                                },
                            }}
                            label="Alert Message"
                            value={alertMessage}
                            onChange={(e) => setAlertMessage(e.target.value)}
                            disabled={readOnly}
                            required
                            margin="normal"
                            multiline
                            minRows={2}
                            maxRows={6}
                            inputProps={{
                                style: { resize: 'vertical', maxHeight: 160, overflow: 'auto' }
                            }}
                        />

                        <Typography variant="subtitle1" mt={3}>
                            Retrigger After
                        </Typography>
                        <Box display="flex" gap={2} mt={1}>
                            <TextField
                                type="number"
                                label="Days"
                                value={retriggerDays}
                                onChange={(e) => setRetriggerDays(Number(e.target.value))}
                                disabled={readOnly}
                                sx={{ width: 100 }}
                            />
                            <TextField
                                type="number"
                                label="Hours"
                                value={retriggerHours}
                                onChange={(e) => setRetriggerHours(Number(e.target.value))}
                                disabled={readOnly}
                                sx={{ width: 100 }}
                            />
                            <TextField
                                type="number"
                                label="Minutes"
                                value={retriggerMinutes}
                                onChange={(e) => setRetriggerMinutes(Number(e.target.value))}
                                disabled={readOnly}
                                sx={{ width: 100 }}
                            />
                        </Box>

                        <Box mt={3} display="flex" gap={2}>
                            {!readOnly && (
                                <Button type="submit" variant="contained" color="primary">
                                    Save
                                </Button>
                            )}
                            <Button variant="outlined" onClick={() => router.push('/rules')}>
                                Cancel
                            </Button>
                        </Box>

                        {error && <Typography color="error" mt={2}>{error}</Typography>}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
