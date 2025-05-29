'use client';
import * as React from 'react';
import Link from 'next/link';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { areaElementClasses } from '@mui/x-charts/LineChart';

export type StatCardProps = {
    title: string;
    value: string;
    interval: string;
    trend: 'up' | 'down' | 'neutral';
    trendLabel?: string;
    data: number[];
    labels?: string[];
    color?: string; // ✅ custom color
    href?: string;  // ✅ NEW: link destination for stat number
};

function getDaysInMonth(month: number, year: number) {
    const date = new Date(year, month, 0);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const daysInMonth = date.getDate();
    return Array.from({ length: daysInMonth }, (_, i) => `${monthName} ${i + 1}`);
}

function AreaGradient({ color, id }: { color: string; id: string }) {
    return (
        <defs>
            <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
        </defs>
    );
}

export default function StatCard({
                                     title,
                                     value,
                                     interval,
                                     trend,
                                     trendLabel,
                                     data,
                                     labels,
                                     color,
                                     href, // ✅ NEW
                                 }: StatCardProps) {
    const theme = useTheme();
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const defaultLabels = getDaysInMonth(month + 1, year).slice(0, data.length);

    const trendColors = {
        up: theme.palette.mode === 'light' ? theme.palette.success.main : theme.palette.success.dark,
        down: theme.palette.mode === 'light' ? theme.palette.error.main : theme.palette.error.dark,
        neutral: theme.palette.mode === 'light' ? theme.palette.grey[400] : theme.palette.grey[700],
    };

    const labelColors = {
        up: 'success' as const,
        down: 'error' as const,
        neutral: 'default' as const,
    };

    const fallbackTrendValues = {
        up: '+25%',
        down: '-25%',
        neutral: '+0%',
    };

    const chipColor = labelColors[trend];
    const chartColor = color || trendColors[trend]; // ✅ Use custom color if provided
    const chartLabels = labels ?? defaultLabels;

    return (
        <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
            <CardContent>
                <Typography component="h2" variant="subtitle2" gutterBottom>
                    {title}
                </Typography>
                <Stack direction="column" sx={{ justifyContent: 'space-between', flexGrow: 1, gap: 1 }}>
                    <Stack>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            {href ? (
                                <Link href={href} style={{ textDecoration: 'none' }}>
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 700,
                                            color,
                                            mb: 0.5,
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            display: 'inline-block',
                                        }}
                                    >
                                        {value}
                                    </Typography>
                                </Link>
                            ) : (
                                <Typography variant="h4">{value}</Typography>
                            )}
                            <Chip size="small" color={chipColor} label={trendLabel ?? fallbackTrendValues[trend]} />
                        </Stack>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {interval}
                        </Typography>
                    </Stack>
                    <Box sx={{ width: '100%', height: 50 }}>
                        <SparkLineChart
                            color={chartColor}
                            data={data}
                            area
                            showHighlight
                            showTooltip
                            xAxis={{
                                scaleType: 'band',
                                data: chartLabels,
                            }}
                            sx={{
                                [`& .${areaElementClasses.root}`]: {
                                    fill: `url(#area-gradient-${value})`,
                                },
                            }}
                        >
                            <AreaGradient color={chartColor} id={`area-gradient-${value}`} />
                        </SparkLineChart>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}
