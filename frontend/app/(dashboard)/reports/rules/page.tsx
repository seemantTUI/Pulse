'use client';

import React, { useMemo, useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

import {
    Box, Card, CardContent, Typography, MenuItem,
    Select, FormControl, InputLabel, ToggleButton, ToggleButtonGroup, Paper, CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import SaveAltIcon from '@mui/icons-material/SaveAlt';
import useRulesData from '../../../hooks/useRulesData';
import useRuleBreachLogs from '../../../hooks/useRuleBreachLogs';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis,
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

// CSV Export utility
const exportCSV = (rows: any[], fileName = 'export.csv') => {
    if (!rows.length) return;
    const csvContent =
        "data:text/csv;charset=utf-8," +
        [
            Object.keys(rows[0]).join(","), // headers
            ...rows.map(row => Object.values(row).join(","))
        ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link); // Required for FF
    link.click();
    link.remove();
};

export default function RuleBreachTimeOfDayChart() {
    const { rows: rules = [] } = useRulesData();
    const [selectedRuleId, setSelectedRuleId] = useState<string>('');
    const [startDate, setStartDate] = useState<Dayjs | null>(null);
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const [presetRange, setPresetRange] = useState<number | "">("");
    const [chartType, setChartType] = useState<'line' | 'area'>('line');

    const { logs, loading } = useRuleBreachLogs(selectedRuleId);

    useEffect(() => {
        if (rules.length && !selectedRuleId) setSelectedRuleId(rules[0]._id);
    }, [rules, selectedRuleId]);

    // --- Range dropdown logic ---
    const handlePresetRange = (days: number) => {
        const now = dayjs();
        setStartDate(now.subtract(days, 'day'));
        setEndDate(now);
    };

    useEffect(() => {
        if (presetRange) {
            handlePresetRange(Number(presetRange));
        }
    }, [presetRange]);

    // --- Data Preparation for Date vs Time-of-Day ---
    const chartData = useMemo(() => {
        if (!selectedRuleId || !logs.length) return [];

        let filtered = logs;
        if (startDate && endDate) {
            filtered = logs.filter(l =>
                dayjs(l.triggeredAt).isSameOrAfter(startDate, 'minute') &&
                dayjs(l.triggeredAt).isSameOrBefore(endDate, 'minute')
            );
        }
        // Group all breach events by date, then put time (in hours, float) as y
        // Each event: { date: '2024-05-31', timeOfDay: 13.5 }
        return filtered.map(l => {
            const d = dayjs(l.triggeredAt);
            return {
                date: d.format('YYYY-MM-DD'),
                timeOfDay: d.hour() + d.minute()/60,
                full: d.format('YYYY-MM-DD HH:mm:ss'),
            };
        });
    }, [logs, startDate, endDate, selectedRuleId]);

    // For stats
    const stats = useMemo(() => {
        if (!logs.length) return { count: 0, first: "-", last: "-" };
        const sorted = [...logs].sort((a, b) => new Date(a.triggeredAt).getTime() - new Date(b.triggeredAt).getTime());
        const first = sorted[0].triggeredAt;
        const last = sorted[sorted.length - 1].triggeredAt;
        return {
            count: logs.length,
            first: first ? dayjs(first).format('YYYY-MM-DD HH:mm:ss') : "-",
            last: last ? dayjs(last).format('YYYY-MM-DD HH:mm:ss') : "-"
        };
    }, [logs]);

    // Axis tick formatter for Y (time of day)
    function formatTimeOfDay(value: number) {
        const hour = Math.floor(value);
        const min = Math.round((value - hour) * 60);
        return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }

    // Chart rendering
    const renderChart = () => {
        if (loading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" height={320}>
                    <CircularProgress />
                </Box>
            );
        }
        if (!selectedRuleId) {
            return (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ p: 4 }}
                >
                    Select a rule to show the chart.
                </Typography>
            );
        }
        if (!chartData.length) {
            return (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ p: 4 }}
                >
                    No data available to display.
                </Typography>
            );
        }

        // Note: To display as "spikes/dots", set type="monotone" but the y-values will not connect, only show pulses.
        if (chartType === 'line') {
            return (
                <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 40, left: 50 }}>
                    <XAxis
                        dataKey="date"
                        type="category"
                        allowDuplicatedCategory={false}
                        tick={{ fontSize: 12, angle: -30, textAnchor: "end" }}
                    />
                    <YAxis
                        dataKey="timeOfDay"
                        domain={[0, 24]}
                        ticks={[0, 6, 12, 18, 24]}
                        tickFormatter={formatTimeOfDay}
                        label={{ value: "Time of Day", angle: -90, position: 'insideLeft', fontSize: 12 }}
                    />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Legend />
                    <RechartsTooltip
                        formatter={(value: any, name: any, props: any) =>
                            `Time: ${formatTimeOfDay(value)}`
                        }
                        labelFormatter={(label: string, payload: any) => {
                            if (payload && payload[0] && payload[0].payload) {
                                return `Breach at ${payload[0].payload.full}`;
                            }
                            return label;
                        }}
                    />
                    <Line
                        type="linear"
                        dataKey="timeOfDay"
                        name={rules.find(r => r._id === selectedRuleId)?.ruleName || "Breach"}
                        stroke={`rgb(220,38,38)`}
                        strokeWidth={2}
                        dot={{ r: 5, fill: 'rgb(220,38,38)' }}
                        activeDot={{ r: 7 }}
                        // No connecting line
                        connectNulls={false}
                        legendType="circle"
                    />
                </LineChart>
            );
        }

        if (chartType === 'area') {
            return (
                <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 40, left: 50 }}>
                    <XAxis
                        dataKey="date"
                        type="category"
                        allowDuplicatedCategory={false}
                        tick={{ fontSize: 12, angle: -30, textAnchor: "end" }}
                    />
                    <YAxis
                        dataKey="timeOfDay"
                        domain={[0, 24]}
                        ticks={[0, 6, 12, 18, 24]}
                        tickFormatter={formatTimeOfDay}
                        label={{ value: "Time of Day", angle: -90, position: 'insideLeft', fontSize: 12 }}
                    />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Legend />
                    <RechartsTooltip
                        formatter={(value: any, name: any, props: any) =>
                            `Time: ${formatTimeOfDay(value)}`
                        }
                        labelFormatter={(label: string, payload: any) => {
                            if (payload && payload[0] && payload[0].payload) {
                                return `Breach at ${payload[0].payload.full}`;
                            }
                            return label;
                        }}
                    />
                    <Area
                        type="linear"
                        dataKey="timeOfDay"
                        name={rules.find(r => r._id === selectedRuleId)?.ruleName || "Breach"}
                        stroke={`rgb(220,38,38)`}
                        fill={`rgba(220,38,38,0.20)`}
                        strokeWidth={2}
                        dot={{ r: 5, fill: 'rgb(220,38,38)' }}
                        activeDot={{ r: 7 }}
                        legendType="circle"
                    />
                </AreaChart>
            );
        }

        return <div />;
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box p={{ xs: 1, sm: 3 }}>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={5} md={4}>
                            <FormControl fullWidth>
                                <InputLabel id="rule-select-label">Select Rule</InputLabel>
                                <Select
                                    labelId="rule-select-label"
                                    value={selectedRuleId}
                                    onChange={e => setSelectedRuleId(e.target.value)}
                                    label="Select Rule"
                                >
                                    {rules.map((rule: any) => (
                                        <MenuItem key={rule._id} value={rule._id}>
                                            {rule.ruleName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} sm={3} md={2}>
                            <DatePicker
                                label="From"
                                value={startDate}
                                onChange={setStartDate}
                                slotProps={{ textField: { fullWidth: true, size: "small", variant: "outlined" } }}
                            />
                        </Grid>
                        <Grid item xs={6} sm={3} md={2}>
                            <DatePicker
                                label="To"
                                value={endDate}
                                onChange={setEndDate}
                                slotProps={{ textField: { fullWidth: true, size: "small", variant: "outlined" } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4} md={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="range-select-label">Range</InputLabel>
                                <Select
                                    labelId="range-select-label"
                                    value={presetRange}
                                    label="Range"
                                    onChange={e => setPresetRange(e.target.value as number)}
                                >
                                    {[{ label: 'Last 24h', value: 1 }, { label: 'Last 7d', value: 7 }, { label: 'Last 30d', value: 30 }].map(r => (
                                        <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4} md={2}>
                            <ToggleButtonGroup
                                value={chartType}
                                exclusive
                                onChange={(e, t) => t && setChartType(t)}
                                color="primary"
                                size="small"
                            >
                                <ToggleButton value="line" key="line">Line</ToggleButton>
                                <ToggleButton value="area" key="area">Area</ToggleButton>
                            </ToggleButtonGroup>
                        </Grid>
                        <Grid item xs={12} sm={8} md={2.5} display="flex" gap={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                            <Box>
                                <SaveAltIcon sx={{ verticalAlign: "middle", mr: 1, cursor: 'pointer' }}
                                             onClick={() => exportCSV(chartData, 'rule-breaches-timeofday.csv')}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                <Box mb={2} display="flex" flexDirection="row" alignItems="stretch" sx={{ width: "100%" }}>
                    <Card sx={{ minWidth: 120, flex: 1, mx: 0.5, bgcolor: "background.paper", boxShadow: "none" }}>
                        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                            <Typography color="text.secondary" variant="caption">
                                {rules.find(r => r._id === selectedRuleId)?.ruleName || "Rule"}
                            </Typography>
                            <Typography color="success.main" variant="subtitle1" fontWeight="bold">
                                Total: {stats.count}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ minWidth: 120, flex: 1, mx: 0.5, bgcolor: "background.paper", boxShadow: "none" }}>
                        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                            <Typography color="text.secondary" variant="caption">
                                First Breach
                            </Typography>
                            <Typography color="info.main" variant="subtitle1" fontWeight="bold">
                                {stats.first}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ minWidth: 120, flex: 1, mx: 0.5, bgcolor: "background.paper", boxShadow: "none" }}>
                        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                            <Typography color="text.secondary" variant="caption">
                                Last Breach
                            </Typography>
                            <Typography color="warning.main" variant="subtitle1" fontWeight="bold">
                                {stats.last}
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" mb={2}>Breach Events by Time of Day</Typography>
                    <Box sx={{ width: "100%", height: 380 }}>
                        <ResponsiveContainer>
                            {renderChart()}
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            </Box>
        </LocalizationProvider>
    );
}
