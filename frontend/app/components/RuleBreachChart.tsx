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
import useRulesData from '../hooks/useRulesData'; // <-- Import your hook
import useRuleBreachLogs from '../hooks/useRuleBreachLogs';

interface Rule {
  _id: string;
  ruleName: string;
}

export default function RuleBreachChart() {
  const { rows: ruleRows = [], loading: rulesLoading } = useRulesData(); // <-- Use the hook
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const initRef = useRef(false);

  // Set rules from hook (no axios)
  const rules: Rule[] = ruleRows;

  // Set initial selected rule once rules load
  useEffect(() => {
    if (rules.length > 0 && !initRef.current) {
      initRef.current = true;
      setSelectedRuleId(rules[0]._id);
    }
  }, [rules]);

  // Fetch breach logs whenever ruleId changes
  const { logs, loading } = useRuleBreachLogs(selectedRuleId);

  // Prepare last-24h buckets
  const now = Date.now();
  const buckets: Record<string, number[]> = {};
  for (let h = 0; h < 24; h++) buckets[`${h}:00`] = [];

  logs.forEach((log) => {
    const t = new Date(log.triggeredAt).getTime();
    const deltaH = Math.floor((now - t) / 3_600_000);
    if (deltaH < 24) {
      const hr = new Date(log.triggeredAt).getHours();
      buckets[`${hr}:00`].push(log.value);
    }
  });

  const labels: string[] = [];
  const values: number[] = [];
  Object.entries(buckets).forEach(([hour, arr]) => {
    labels.push(hour);
    const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    values.push(parseFloat(avg.toFixed(2)));
  });

  const nonZero = values.filter((v) => v > 0);
  const avg = nonZero.length
      ? (nonZero.reduce((a, b) => a + b, 0) / nonZero.length).toFixed(2)
      : '-';
  const min = nonZero.length ? Math.min(...nonZero).toFixed(2) : '-';
  const max = nonZero.length ? Math.max(...nonZero).toFixed(2) : '-';

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

          {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
          ) : (
              <LineChart
                  height={280}
                  series={[{ data: values }]}
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
