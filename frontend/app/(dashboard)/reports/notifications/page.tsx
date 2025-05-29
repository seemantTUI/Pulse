'use client';

import React, { useMemo, useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

import {
    Box, Paper, Typography, CircularProgress, MenuItem, Select, FormControl, InputLabel,
    ToggleButton, ToggleButtonGroup
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DataGrid } from '@mui/x-data-grid';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis,
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

import useNotificationsData from '../../../hooks/useNotificationsData';

const presetRanges = [
    { label: 'Last 24h', value: 1 },
    { label: 'Last 7d', value: 7 },
    { label: 'Last 30d', value: 30 }
];
const chartTypes = [
    { value: 'bar', label: 'Bar' },
    { value: 'line', label: 'Line' }
];

function StatCard({ title, value, color = "primary.main" }: { title: string, value: any, color?: string }) {
    return (
        <Paper sx={{ minWidth: 140, flex: 1, mx: 0.5, p: 1, boxShadow: "none", bgcolor: "background.paper" }}>
            <Typography color="text.secondary" variant="caption">{title}</Typography>
            <Typography color={color} variant="subtitle1" fontWeight="bold">{value}</Typography>
        </Paper>
    );
}

export default function NotificationReportsPage() {
    const { rows: notifications = [], columns, loading } = useNotificationsData();

    // --- State ---
    const [startDate, setStartDate] = useState<Dayjs | null>(null);
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const [presetRange, setPresetRange] = useState<number | "">("");
    const [chartType, setChartType] = useState('bar');

    // --- Preset range logic ---
    const handlePresetRange = (days: number) => {
        const now = dayjs();
        setStartDate(now.subtract(days, 'day').startOf('day'));
        setEndDate(now.endOf('day'));
    };
    useEffect(() => {
        if (presetRange) {
            handlePresetRange(Number(presetRange));
        }
    }, [presetRange]);

    // --- Filter notifications in date range ---
    const filteredNotifications = useMemo(() => {
        if (!startDate || !endDate) return notifications;
        return notifications.filter(n =>
            dayjs(n.createdAt).isSameOrAfter(startDate, 'minute') &&
            dayjs(n.createdAt).isSameOrBefore(endDate, 'minute')
        );
    }, [notifications, startDate, endDate]);

    // --- Daily counts for chart ---
    const dailyCounts = useMemo(() => {
        const map: Record<string, number> = {};
        filteredNotifications.forEach(n => {
            const d = dayjs(n.createdAt).format('YYYY-MM-DD');
            map[d] = (map[d] || 0) + 1;
        });
        return Object.entries(map)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredNotifications]);

    // --- Stats ---
    const total = filteredNotifications.length;
    const last = filteredNotifications[0]?.createdAt
        ? dayjs(filteredNotifications[0].createdAt).format('YYYY-MM-DD HH:mm')
        : "-";
    const uniqueRules = new Set(filteredNotifications.map(n => n.ruleId?._id).filter(Boolean)).size;

    // --- Chart Render ---
    const renderChart = () => {
        if (loading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" height={320}>
                    <CircularProgress />
                </Box>
            );
        }
        if (!filteredNotifications.length) {
            return (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ p: 4 }}
                >
                    No notifications to display.
                </Typography>
            );
        }

        if (chartType === "bar") {
            return (
                <BarChart data={dailyCounts}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="count" name="Notifications" fill="#1976d2" />
                </BarChart>
            );
        }
        if (chartType === "line") {
            return (
                <LineChart data={dailyCounts}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <RechartsTooltip />
                    <Legend />
                    <Line dataKey="count" name="Notifications" stroke="#1976d2" strokeWidth={2} />
                </LineChart>
            );
        }
        return <div />;
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box p={{ xs: 1, sm: 3 }}>
                <Typography variant="h5" gutterBottom>Notification Reports</Typography>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4} md={3}>
                            <DatePicker
                                label="From"
                                value={startDate}
                                onChange={setStartDate}
                                slotProps={{ textField: { fullWidth: true, size: "small", variant: "outlined" } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4} md={3}>
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
                                    {presetRanges.map(r => (
                                        <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
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
                    </Grid>
                </Paper>

                <Box display="flex" flexDirection="row" gap={2} mb={2}>
                    <StatCard title="Total Notifications" value={total} color="info.main" />
                    <StatCard title="Last Notification" value={last} color="success.main" />
                    <StatCard title="Unique Rules" value={uniqueRules} color="warning.main" />
                </Box>

                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" mb={2}>Notification Trend</Typography>
                    <Box sx={{ width: "100%", height: 340 }}>
                        <ResponsiveContainer>
                            {renderChart()}
                        </ResponsiveContainer>
                    </Box>
                </Paper>

                <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" mb={2}>All Notifications</Typography>
                    <DataGrid
                        rows={filteredNotifications.map((n, idx) => ({ ...n, id: n._id }))}
                        columns={columns}
                        loading={loading}
                        getRowClassName={() => ''}
                        sx={{ background: "white" }}
                    />
                </Paper>
            </Box>
        </LocalizationProvider>
    );
}
