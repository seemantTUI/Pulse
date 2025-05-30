'use client';
import React, { useEffect, useRef, useState } from 'react';
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
import useRulesData from '../hooks/useRulesData';
import useRuleBreachLogs from '../hooks/useRuleBreachLogs';

interface Rule {
  _id: string;
  ruleName: string;
}

export default function RuleBreachChart() {
  const { rows: ruleRows = [], loading: rulesLoading } = useRulesData();
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const initRef = useRef(false);

  const rules: Rule[] = ruleRows;

  useEffect(() => {
    if (rules.length > 0 && !initRef.current) {
      initRef.current = true;
      setSelectedRuleId(rules[0]._id);
    }
  }, [rules]);

  const { logs, loading } = useRuleBreachLogs(selectedRuleId);

  // Prepare 24 hour buckets (hour label: count)
  const now = Date.now();
  const buckets: Record<string, number> = {};
  for (let h = 0; h < 24; h++) buckets[`${h}:00`] = 0;

  logs.forEach((log) => {
    const t = new Date(log.triggeredAt).getTime();
    const deltaH = Math.floor((now - t) / 3_600_000);
    if (deltaH < 24) {
      const hr = new Date(log.triggeredAt).getHours();
      buckets[`${hr}:00`] += 1;
    }
  });

  // X axis (hours), Y axis (counts)
  const labels: string[] = Object.keys(buckets);
  const values: number[] = Object.values(buckets);

  const totalBreaches = logs.filter((log) => (now - new Date(log.triggeredAt).getTime()) < 24 * 3600_000).length;
  const lastBreach = logs.length
      ? new Date(
          Math.max(...logs.map((log) => new Date(log.triggeredAt).getTime()))
      )
      : null;

  return (
      <Card variant="outlined">
        <CardContent>
          <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
            <InputLabel id="rule-select" sx={{ fontWeight: 600 }}>
              Rule
            </InputLabel>
            <Select
                labelId="rule-select"
                value={selectedRuleId}
                label="Rule"
                onChange={(e) => setSelectedRuleId(e.target.value)}
                disabled={rulesLoading}
            >
              {rules.map((r) => (
                  <MenuItem key={r._id} value={r._id}>
                    {r.ruleName}
                  </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" gutterBottom>
            Breach Frequency (Last 24 Hours)
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Total breaches: <b>{totalBreaches}</b>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last breach:{' '}
              <b>
                {lastBreach
                    ? lastBreach.toLocaleString()
                    : '-'}
              </b>
            </Typography>
          </Stack>

          {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
          ) : (
              <LineChart
                  height={280}
                  series={[{ data: values, label: 'Breaches' }]}
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
