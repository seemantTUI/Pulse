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

import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis,
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
// import ImageIcon from '@mui/icons-material/Image'; // REMOVED PNG EXPORT
import useMetricsData from '../../../hooks/useMetricsData';
import useMultipleMetricHistories from '../../../hooks/useMultipleMetricsLog';

const chartTypes = [
    { value: 'line', label: 'Line' },
    { value: 'area', label: 'Area' }
];

const presetRanges = [
    { label: 'Last 24h', value: 1 },
    { label: 'Last 7d', value: 7 },
    { label: 'Last 30d', value: 30 }
];

function StatCard({ title, value, color = "primary.main" }: { title: string, value: any, color?: string }) {
    return (
        <Card sx={{ minWidth: 120, flex: 1, mx: 0.5, bgcolor: "background.paper", boxShadow: "none" }}>
            <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                <Typography color="text.secondary" variant="caption">{title}</Typography>
                <Typography color={color} variant="subtitle1" fontWeight="bold">{value}</Typography>
            </CardContent>
        </Card>
    );
}

function OutlierDot({ cx, cy }: { cx: number, cy: number }) {
    return (
        <circle cx={cx} cy={cy} r={5} fill="red" stroke="white" strokeWidth={2} />
    );
}

// Detects outliers (simple: value > avg ± 2*stddev)
function getOutliers(data: any[]) {
    if (!data.length) return [];
    const values = data.map(d => d.value);
    const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const std = Math.sqrt(values.map((v: number) => (v - avg) ** 2).reduce((a: number, b: number) => a + b, 0) / values.length);
    const threshold = 2 * std;
    return data.filter((d: any) => Math.abs(d.value - avg) > threshold).map((d: any) => d._id);
}

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

export default function ReportsPage() {
    const { rows: metrics = [] } = useMetricsData();

    // --- State ---
    const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<Dayjs | null>(null);
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const [presetRange, setPresetRange] = useState<number | "">(""); // dropdown value
    const [chartType, setChartType] = useState('line');

    // --- Data fetching ---
    const { logsById, loading } = useMultipleMetricHistories(selectedMetricIds);

    // Build allMetricLogs as a mapping from metric id -> logs
    const allMetricLogs: Record<string, any[]> = useMemo(() => logsById, [logsById]);

    // --- Data processing ---
    const mergedData = useMemo(() => {
        if (selectedMetricIds.length === 0) return [];
        const timeMap: Record<string, any> = {};
        selectedMetricIds.forEach(id => {
            (allMetricLogs[id] || []).forEach(log => {
                if (!log.createdAt) return;
                const t = new Date(log.createdAt).toISOString();
                if (!timeMap[t]) timeMap[t] = { time: t };
                timeMap[t][id] = log.value;
                timeMap[t][`${id}_logId`] = log._id;
            });
        });
        let arr = Object.values(timeMap);
        arr = arr.sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());
        if (startDate && endDate) {
            arr = arr.filter(
                (d: any) =>
                    dayjs(d.time).isSameOrAfter(startDate, 'minute') &&
                    dayjs(d.time).isSameOrBefore(endDate, 'minute')
            );
        }
        return arr;
    }, [selectedMetricIds, allMetricLogs, startDate, endDate]);

    const stats = useMemo(
        () =>
            selectedMetricIds.map(id => {
                const logs = allMetricLogs[id] || [];
                let filtered = logs;
                if (startDate && endDate) {
                    filtered = logs.filter(
                        (l: any) =>
                            dayjs(l.createdAt).isSameOrAfter(startDate, 'minute') &&
                            dayjs(l.createdAt).isSameOrBefore(endDate, 'minute')
                    );
                }
                if (!filtered.length)
                    return {
                        id,
                        min: "-",
                        max: "-",
                        avg: "-",
                        latest: "-"
                    };
                const values = filtered.map((l: any) => l.value);
                const min = Math.min(...values);
                const max = Math.max(...values);
                const avg = (values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(2);
                const latest = filtered[filtered.length - 1].value;
                return { id, min, max, avg, latest };
            }),
        [selectedMetricIds, allMetricLogs, startDate, endDate]
    );

    // Outliers
    const outlierMap: Record<string, string[]> = useMemo(() => {
        const map: Record<string, string[]> = {};
        selectedMetricIds.forEach(id => {
            const logs = (allMetricLogs[id] || []);
            map[id] = getOutliers(logs);
        });
        return map;
    }, [selectedMetricIds, allMetricLogs]);

    // Limit metrics to max 2 selections
    const handleMetricSelect = (event: any) => {
        const value = event.target.value as string[];
        if (value.length <= 2) {
            setSelectedMetricIds(value);
        }
    };

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

    // X tick formatter removes Z
    const xTickFormatter = (t: string) => {
        const date = new Date(t);
        return date.toLocaleTimeString().replace(/Z$/, '');
    };
    const tooltipFormatter = (val: any) => val;
    const labelFormatter = (label: string) =>
        new Date(label).toLocaleString().replace(/Z$/, '');

    // --- Render Chart ---
    const renderChart = () => {
        if (loading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" height={320}>
                    <CircularProgress />
                </Box>
            );
        }
        if (!selectedMetricIds.length) {
            return (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ p: 4 }}
                >
                    Select a metric to show the chart.
                </Typography>
            );
        }
        if (!mergedData.length) {
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

        // --- LINE ---
        if (chartType === 'line') {
            return (
                <LineChart data={mergedData}>
                    <XAxis dataKey="time" tickFormatter={xTickFormatter} />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <RechartsTooltip formatter={tooltipFormatter} labelFormatter={labelFormatter} />
                    <Legend />
                    {selectedMetricIds.map((id, idx) => (
                        <Line
                            key={id}
                            type="monotone"
                            dataKey={id}
                            name={metrics.find((m: any) => m.id === id || m._id === id)?.metricName}
                            stroke={`hsl(${(idx * 57) % 360},70%,50%)`}
                            strokeWidth={2}
                            dot={({ cx, cy, ...props }) => {
                                const isOutlier = mergedData.find((d: any) => d.time && d[id] !== undefined && d[`${id}_logId`] && outlierMap[id]?.includes(d[`${id}_logId`]) && d.time === props.payload.time);
                                return isOutlier
                                    ? <OutlierDot cx={cx as number} cy={cy as number} />
                                    : <circle cx={cx} cy={cy} r={3} fill={`hsl(${(idx * 57) % 360},70%,50%)`} />;
                            }}
                        />
                    ))}
                </LineChart>
            );
        }

        // --- AREA (only for single metric) ---
        if (chartType === 'area') {
            if (selectedMetricIds.length > 1) {
                return (
                    <Typography
                        variant="body2"
                        color="warning.main"
                        align="center"
                        sx={{ p: 4 }}
                    >
                        Area charts are best for single-metric visualization. Please select only one metric for area chart.
                    </Typography>
                );
            }
            return (
                <AreaChart data={mergedData}>
                    <XAxis dataKey="time" tickFormatter={xTickFormatter} />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <RechartsTooltip formatter={tooltipFormatter} labelFormatter={labelFormatter} />
                    <Legend />
                    {selectedMetricIds.map((id, idx) => (
                        <Area
                            key={id}
                            type="monotone"
                            dataKey={id}
                            name={metrics.find((m: any) => m.id === id || m._id === id)?.metricName}
                            stroke={`hsl(${(idx * 57) % 360},70%,50%)`}
                            fill={`hsl(${(idx * 57) % 360},70%,50%)`}
                            fillOpacity={0.20}
                            strokeWidth={2}
                        />
                    ))}
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
                            <FormControl>
                                <InputLabel id="metric-select-label">Select Metric(s)</InputLabel>
                                <Select
                                    labelId="metric-select-label"
                                    multiple
                                    value={selectedMetricIds}
                                    onChange={handleMetricSelect}
                                    label="Select Metric(s)"
                                    renderValue={(selected) =>
                                        (selected as string[]).map(id =>
                                            metrics.find((m: any) => m.id === id || m._id === id)?.metricName
                                        ).join(', ')
                                    }
                                >
                                    {metrics.map((metric: any) => (
                                        <MenuItem
                                            key={metric.id || metric._id}
                                            value={metric.id || metric._id}
                                            disabled={
                                                selectedMetricIds.length >= 2 &&
                                                !selectedMetricIds.includes(metric.id || metric._id)
                                            }
                                        >
                                            {metric.metricName}
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
                                slotProps={{ textField: { fullWidth: false, size: "small", variant: "outlined" } }}
                            />
                        </Grid>
                        <Grid item xs={6} sm={3} md={2}>
                            <DatePicker
                                label="To"
                                value={endDate}
                                onChange={setEndDate}
                                slotProps={{ textField: { fullWidth: false, size: "small", variant: "outlined" } }}
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
                                    {presetRanges.map(r => (
                                        <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4} md={1.5}>
                            <ToggleButtonGroup
                                value={chartType}
                                exclusive
                                onChange={(e, t) => t && setChartType(t)}
                                color="primary"
                                size="small"
                            >
                                {chartTypes.map(t => (
                                    <ToggleButton value={t.value} key={t.value}>{t.label}</ToggleButton>
                                ))}
                            </ToggleButtonGroup>
                        </Grid>
                        <Grid item xs={12} sm={8} md={2.5} display="flex" gap={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                            <Box>
                                <SaveAltIcon sx={{ verticalAlign: "middle", mr: 1, cursor: 'pointer' }}
                                             onClick={() => exportCSV(mergedData, 'metrics-report.csv')}
                                />
                                {/* PNG Export Removed */}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Stats cards: horizontal for each metric */}
                <Box mb={2}>
                    {stats.map((s, idx) => (
                        <Box
                            key={s.id}
                            display="flex"
                            flexDirection="row"
                            alignItems="stretch"
                            mb={1}
                            sx={{ width: "80%" }}
                        >
                            <StatCard
                                title={metrics.find((m: any) => m.id === s.id || m._id === s.id)?.metricName || "Metric"}
                                value={s.latest}
                                color="success.main"
                            />
                            <StatCard title="Min" value={s.min} color="info.main" />
                            <StatCard title="Max" value={s.max} color="warning.main" />
                            <StatCard title="Avg" value={s.avg} color="primary.main" />
                        </Box>
                    ))}
                </Box>

                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" mb={2}>Chart</Typography>
                    <Box sx={{ width: "100%", height: 340 }}>
                        <ResponsiveContainer>
                            {renderChart()}
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            </Box>
        </LocalizationProvider>
    );
}
