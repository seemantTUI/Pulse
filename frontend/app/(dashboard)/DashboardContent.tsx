'use client';
import * as React from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatCard from '../components/StatCard';
import HighlightedCard from '../components/ExportCard';
import RuleBreachChart from '../components/RuleBreachChart';
import MetricsViewsLineChart from '../components/MetricsViewsLineChart';
import useRulesData from '../hooks/useRulesData';
import useMetricsData from '../hooks/useMetricsData';
import useNotificationsData from '../hooks/useNotificationsData';

export default function DashboardContent() {
  const { rows: ruleRows } = useRulesData();
  const { rows: metricRows } = useMetricsData();
  const { rows: notificationRows } = useNotificationsData();

  const now = new Date();
  const last30Days: string[] = [];
  const dateMap: Record<string, number> = {};

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dateMap[key] = last30Days.length;
    last30Days.push(key);
  }

  const formattedLabels = last30Days.map(dateStr =>
      new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );

  // --- RULES ---
  const ruleCountPerDay = Array(30).fill(0);
  ruleRows.forEach(rule => {
    const dateStr = new Date(rule.createdAt).toISOString().split('T')[0];
    if (dateStr in dateMap) ruleCountPerDay[dateMap[dateStr]] += 1;
  });
  const ruleTotal = ruleCountPerDay.reduce((a, b) => a + b, 0);
  const ruleTrend = ruleTotal > 0 ? 'up' : 'neutral' as const;
  const ruleTrendLabel = ruleTotal > 0 ? '+100%' : '+0%';

  // --- METRICS ---
  const metricValues = metricRows.map(m => m.value);
  const metricLabels = metricRows.map(m => m.metricName);
  const metricTotal = metricRows.length;
  const metricTrend = metricTotal > 0 ? 'up' : 'neutral' as const;
  const metricTrendLabel = metricTotal > 0 ? '+100%' : '+0%';

  // --- NOTIFICATIONS ---
  const notificationCountPerDay = Array(30).fill(0);
  notificationRows.forEach(n => {
    const dateStr = new Date(n.createdAt).toISOString().split('T')[0];
    if (dateStr in dateMap) notificationCountPerDay[dateMap[dateStr]] += 1;
  });
  const notificationTotal = notificationCountPerDay.reduce((a, b) => a + b, 0);
  const notificationTrend = notificationTotal > 0 ? 'up' : 'neutral' as const;
  const notificationTrendLabel = notificationTotal > 0 ? '+100%' : '+0%';

  return (
      <Box sx={{ display: 'flex' }}>
        <Box
            component="main"
            sx={(theme) => ({
              flexGrow: 1,
              backgroundColor: theme.vars
                  ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                  : alpha(theme.palette.background.default, 1),
              overflow: 'auto',
            })}
        >
          <Stack spacing={2} sx={{ alignItems: 'center', mx: 3, pb: 5, mt: { xs: 8, md: 0 } }}>
            <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>

              <Grid container spacing={2} columns={12} sx={{ mb: (theme) => theme.spacing(2) }}>
                {/* RULES Card */}
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <StatCard
                      title="Rules"
                      value={String(ruleTotal)}
                      interval="Last 30 days"
                      trend={ruleTrend}
                      trendLabel={ruleTrendLabel}
                      data={ruleCountPerDay}
                      labels={formattedLabels}
                      color="#2e7d32" // green
                      href="/rules"
                  />
                </Grid>

                {/* METRICS Card */}
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <StatCard
                      title="Metrics"
                      value={String(metricTotal)}
                      interval="Current total"
                      trend={metricTrend}
                      trendLabel={metricTrendLabel}
                      data={metricValues}
                      labels={metricLabels}
                      color="#1565c0" // blue
                      href="/metrics"
                  />
                </Grid>

                {/* NOTIFICATIONS Card */}
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <StatCard
                      title="Notifications"
                      value={String(notificationTotal)}
                      interval="Last 30 days"
                      trend={notificationTrend}
                      trendLabel={notificationTrendLabel}
                      data={notificationCountPerDay}
                      labels={formattedLabels}
                      color="#c62828" // red
                      href="/notifications"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <HighlightedCard />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <RuleBreachChart />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <MetricsViewsLineChart />
                </Grid>
              </Grid>


            </Box>
          </Stack>
        </Box>
      </Box>
  );
}
