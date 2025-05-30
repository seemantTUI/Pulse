'use client';

import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Snackbar,
    Alert,
    Card,
    CardContent,
    Typography,
    Tooltip,
    Divider,
    CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';

const exportDataTypes = ['rules', 'metrics', 'notifications', 'metricLogs', 'ruleBreachLogs'];
const formats = ['csv', 'json', 'xml'];

export default function ExportPage() {
    const { data: session, status } = useSession();
    const theme = useTheme();
    const [dataType, setDataType] = useState('rules');
    const [format, setFormat] = useState('csv');
    const [loadingExport, setLoadingExport] = useState(false);
    const [filters, setFilters] = useState({ isArmed: false, startDate: '', endDate: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleExport = async () => {
        if (status !== 'authenticated' || !session?.accessToken) {
            showSnackbar('You must be logged in to export data.', 'error');
            return;
        }

        setLoadingExport(true);
        const params = new URLSearchParams();
        params.set('format', format);
        if (filters.startDate) params.set('startDate', filters.startDate);
        if (filters.endDate) params.set('endDate', filters.endDate);
        if (dataType === 'rules') params.set('isArmed', String(filters.isArmed));

        const url = `${process.env.NEXT_PUBLIC_API_URL}/export?type=${dataType}&${params.toString()}`;

        try {
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const itemCountHeader = res.headers.get('X-Item-Count');
            const itemCount = itemCountHeader ? parseInt(itemCountHeader) : undefined;
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `export-${dataType}-${dayjs().format('YYYY-MM-DD_HH-mm')}.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(downloadUrl);

            showSnackbar(`${dataType} export successful${itemCount ? ` (${itemCount} items)` : ''}.`);
        } catch (err) {
            console.error('Export error:', err);
            showSnackbar('Failed to export data', 'error');
        } finally {
            setLoadingExport(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleResetFilters = () => {
        setFilters({ isArmed: false, startDate: '', endDate: '' });
    };

    const isExportDisabled = !dataType || !format || loadingExport;
    const cardBgColor = theme.palette.mode === 'dark' ? '#1e1e1e' : '#f9f9f9';

    return (
        <Box px={2} py={4}>
            <Card
                sx={{
                    maxWidth: 600,
                    backgroundColor: cardBgColor,
                    borderRadius: 2,
                    boxShadow: theme.palette.mode === 'dark' ? 2 : 4,
                    border: `1px solid ${theme.palette.divider}`,
                }}
            >
                <CardContent>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Select the data type and format. Apply optional filters before exporting.
                    </Typography>

                    <Box mt={4} display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>
                                Data Type
                                <Tooltip title="Select the type of data to export">
                                    <InfoIcon sx={{ ml: 1 }} fontSize="small" />
                                </Tooltip>
                            </InputLabel>
                            <Select value={dataType} onChange={(e) => setDataType(e.target.value)} label="Data Type">
                                {exportDataTypes.map((type) => (
                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>
                                Format
                                <Tooltip title="Choose the export file format">
                                    <InfoIcon sx={{ ml: 1 }} fontSize="small" />
                                </Tooltip>
                            </InputLabel>
                            <Select value={format} onChange={(e) => setFormat(e.target.value)} label="Format">
                                {formats.map((f) => (
                                    <MenuItem key={f} value={f}>{f.toUpperCase()}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {dataType === 'rules' && (
                        <FormGroup sx={{ mt: 2 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={filters.isArmed}
                                        onChange={(e) => setFilters({ ...filters, isArmed: e.target.checked })}
                                    />
                                }
                                label="Only Armed Rules"
                            />
                        </FormGroup>
                    )}

                    <Divider sx={{ my: 3 }} />

                    <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                        <TextField
                            label="Start Date"
                            type="date"
                            name="startDate"
                            size="small"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            name="endDate"
                            size="small"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Box>

                    <Box mt={4} display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            disabled={isExportDisabled}
                            onClick={handleExport}
                            startIcon={!loadingExport ? <DownloadIcon /> : <CircularProgress size={16} color="inherit" />}
                        >
                            {loadingExport ? 'Exporting...' : 'Export'}
                        </Button>

                        <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={handleResetFilters}
                        >
                            Reset Filters
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
