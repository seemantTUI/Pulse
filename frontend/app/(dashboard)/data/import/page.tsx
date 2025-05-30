'use client';

import React, { useState } from 'react';
import {
    Box,
    Button,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Snackbar,
    Alert,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Tooltip,
    Divider,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InfoIcon from '@mui/icons-material/Info';
import { useSession } from 'next-auth/react';
import { useTheme } from '@mui/material/styles';
import DownloadIcon from "@mui/icons-material/Download";

const importDataTypes = ['rules', 'metrics'];
const formats = ['json', 'xml'];

export default function ImportPage() {
    const { data: session, status } = useSession();
    const theme = useTheme();
    const cardBgColor = theme.palette.mode === 'dark' ? '#1e1e1e' : '#f9f9f9';

    const [dataType, setDataType] = useState('rules');
    const [format, setFormat] = useState('json');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

    const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleImport = async () => {
        if (!importFile) return showSnackbar('Please select a file to import.', 'error');
        if (status !== 'authenticated' || !session?.accessToken) {
            return showSnackbar('You must be logged in to import data.', 'error');
        }

        setLoading(true);
        const formData = await importFile.text();

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/import?type=${dataType}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                    'Content-Type': format === 'json' ? 'application/json' : 'application/xml',
                },
                body: formData,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Import failed');

            const importedCount = result.count || undefined;
            showSnackbar(`${dataType} imported successfully${importedCount ? ` (${importedCount} items)` : ''}.`);
            setImportFile(null);
        } catch (err: any) {
            console.error('Import error:', err);
            showSnackbar(err.message || 'Failed to import data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setDataType('rules');
        setFormat('json');
        setImportFile(null);
    };

    const isImportDisabled = !importFile || loading;

    return (
        <Box px={2} py={4}>
            <Card
                sx={{
                    maxWidth: 600,
                    borderRadius: 2,
                    boxShadow: theme.palette.mode === 'dark' ? 2 : 4,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: cardBgColor,
                }}
            >
                <CardContent>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Select the data type and format. Attach a file and click Import.
                    </Typography>

                    <Box mt={4} display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>
                                Data Type
                                <Tooltip title="Select the type of data to import">
                                    <InfoIcon sx={{ ml: 1 }} fontSize="small" />
                                </Tooltip>
                            </InputLabel>
                            <Select
                                value={dataType}
                                onChange={(e) => setDataType(e.target.value)}
                                label="Data Type"
                            >
                                {importDataTypes.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>
                                Format
                                <Tooltip title="Choose the file format for import">
                                    <InfoIcon sx={{ ml: 1 }} fontSize="small" />
                                </Tooltip>
                            </InputLabel>
                            <Select
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                                label="Format"
                            >
                                {formats.map((f) => (
                                    <MenuItem key={f} value={f}>
                                        {f.toUpperCase()}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box>
                        <Button variant="outlined" component="label">
                            {importFile ? importFile.name : 'Choose File'}
                            <input
                                type="file"
                                accept={format === 'json' ? 'application/json' : 'application/xml'}
                                hidden
                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                            />
                        </Button>

                        {importFile && (
                            <Button onClick={() => setImportFile(null)} color="secondary"  sx={{ mt: 1 }}>
                                Remove Attachment
                            </Button>
                        )}
                    </Box>
                    <Box mt={4} display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleImport}
                            disabled={isImportDisabled}
                            startIcon={!loading ? <UploadFileIcon /> : <CircularProgress size={16} color="inherit" />}
                        >
                            {loading ? 'Importing...' : 'Import'}
                        </Button>

                        <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={handleReset}
                        >
                            Reset
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
