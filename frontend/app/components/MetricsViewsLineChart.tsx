'use client';
import React, { useEffect, useState, useRef } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Stack,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
    Box,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { useTheme } from '@mui/material/styles';
import useMetricsData from '../hooks/useMetricsData'; // <-- import your hook
import useMetricHistory from '../hooks/useMetricHistory';

interface Metric {
    _id: string;
    metricName: string;
}

export default function MetricsViewsLineChart() {
    const theme = useTheme();
    const { rows: metricRows = [], loading: metricsLoading } = useMetricsData(); // <-- use the hook
    const [selectedId, setSelectedId] = useState<string>('');
    const initRef = useRef(false);

    // Set metrics from hook
    const metrics: Metric[] = metricRows;

    // Set initial selected metric when loaded
    useEffect(() => {
        if (metrics.length > 0 && !initRef.current) {
            initRef.current = true;
            setSelectedId(metrics[0]._id);
        }
    }, [metrics]);

    // Fetch metric logs
    const now = new Date();
    const start = new Date(now);
    start.setHours(now.getHours() - 24);
    const { logs, loading: logsLoading } = useMetricHistory(selectedId);

    // Aggregate logs into hourly buckets
    const hourlyBuckets: { [hour: string]: number[] } = {};
    for (let i = 0; i < 24; i++) {
        hourlyBuckets[`${i}:00`] = [];
    }

    logs.forEach((log) => {
        const date = new Date(log.createdAt);
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        if (diffHours < 24) {
            const hour = date.getHours();
            hourlyBuckets[`${hour}:00`].push(log.value);
        }
    });

    const labels: string[] = [];
    const hourlyAverages: number[] = [];

    Object.entries(hourlyBuckets).forEach(([label, values]) => {
        labels.push(label);
        const avg = values.length
            ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
            : 0;
        hourlyAverages.push(avg);
    });

    const nonZero = hourlyAverages.filter((v) => v > 0);
    const avg = nonZero.length
        ? (nonZero.reduce((a, b) => a + b, 0) / nonZero.length).toFixed(2)
        : '-';
    const min = nonZero.length ? Math.min(...nonZero).toFixed(2) : '-';
    const max = nonZero.length ? Math.max(...nonZero).toFixed(2) : '-';

    return (
        <Card variant="outlined">
            <CardContent>
                {/* Bold Dropdown Label */}
                <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
                    <InputLabel id="metric-select" sx={{ fontWeight: 600 }}>
                        Metric
                    </InputLabel>
                    <Select
                        labelId="metric-select"
                        value={selectedId}
                        label="Metric"
                        onChange={(e) => setSelectedId(e.target.value)}
                        disabled={metricsLoading}
                    >
                        {metrics.map((m) => (
                            <MenuItem key={m._id} value={m._id}>
                                {m.metricName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Typography variant="subtitle2" gutterBottom>
                    Last 24 Hours
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Avg: <b>{avg}</b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Min: <b>{min}</b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Max: <b>{max}</b>
                    </Typography>
                </Stack>

                {logsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <LineChart
                        height={280}
                        series={[{ data: hourlyAverages }]}
                        xAxis={[{ scaleType: 'band', data: labels }]}
                        grid={{ horizontal: true }}
                        margin={{ left: 50, right: 10, top: 20, bottom: 40 }}
                        hideLegend
                    />
                )}
            </CardContent>
        </Card>
    );
}
