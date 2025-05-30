'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { GridColDef } from '@mui/x-data-grid';
import {
    Box, Button, IconButton, Checkbox, Dialog,
    DialogTitle, DialogContent, DialogContentText,
    DialogActions, Snackbar, Alert, Tooltip, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

import CustomDataGrid from '../../components/CustomDataGrid';
import useMetricsData from '../../hooks/useMetricsData';

export default function MetricsPage() {
    const router = useRouter();
    const { rows, columns: baseCols, loading, deleteMetric, refetch } = useMetricsData();

    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
    const [snackbarMsg, setSnackbarMsg] = React.useState<string | null>(null);

    const isMounted = React.useRef(true);

    React.useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const handleAdd = () => router.push('/metrics/add');
    const handleEdit = (id: string) => router.push(`/metrics/add?id=${id}`);

    const toggleSelect = React.useCallback((id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }, []);

    const confirmDelete = React.useCallback((id: string) => {
        setPendingDeleteId(id);
        setConfirmOpen(true);
    }, []);

    const handleBulkDelete = React.useCallback(() => {
        setPendingDeleteId(null);
        setConfirmOpen(true);
    }, []);

    const executeDelete = React.useCallback(async () => {
        if (pendingDeleteId) {
            await deleteMetric(pendingDeleteId);
            if (isMounted.current) setSnackbarMsg('Metric deleted');
        } else if (selectedIds.length) {
            for (const id of selectedIds) {
                await deleteMetric(id);
            }
            if (isMounted.current) {
                setSnackbarMsg(`${selectedIds.length} metric(s) deleted`);
                setSelectedIds([]);
            }
        }
        if (isMounted.current) {
            setPendingDeleteId(null);
            setConfirmOpen(false);
        }
    }, [pendingDeleteId, selectedIds, deleteMetric]);

    // --- Memoize selectCol and columns ---
    const selectCol: GridColDef = React.useMemo(() => ({
        field: 'select',
        headerName: '',
        width: 50,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderHeader: () => (
            <Checkbox
                size="small"
                checked={selectedIds.length === rows.length && rows.length > 0}
                indeterminate={selectedIds.length > 0 && selectedIds.length < rows.length}
                onChange={(e) =>
                    setSelectedIds(e.target.checked ? rows.map(r => String(r.id)) : [])
                }
            />
        ),
        renderCell: ({ row }) => (
            <Checkbox
                size="small"
                checked={selectedIds.includes(String(row.id))}
                onChange={() => toggleSelect(String(row.id))}
            />
        ),
    }), [selectedIds, rows, toggleSelect]);

    const actionsCol: GridColDef = React.useMemo(
        () => ({
            field: 'actions',
            headerName: 'Actions',
            sortable: false,
            filterable: false,
            flex: 1,
            minWidth: 120,
            renderCell: ({ row }) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit Metric">
                        <IconButton onClick={() => handleEdit(row.id)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Metric">
                        <IconButton onClick={() => confirmDelete(row.id)}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        }),
        [handleEdit, confirmDelete]
    );

    // --- Memoize columns array ---
    const columns = React.useMemo(
        () => [selectCol, ...baseCols, actionsCol],
        [selectCol, baseCols, actionsCol]
    );

    return (
        <Box p={2}>
            <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6"></Typography>
                <Box display="flex" gap={1}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={refetch}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
                        Add Metric
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        disabled={selectedIds.length === 0}
                        onClick={handleBulkDelete}
                    >
                        Delete Selected
                    </Button>
                </Box>
            </Box>

            <Box mb={2}>
                <CustomDataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    autoHeight
                />
                {selectedIds.length > 0 && (
                    <Typography variant="caption" sx={{ mt: 1, ml: 1 }}>
                        {selectedIds.length} metric{selectedIds.length > 1 ? 's' : ''} selected
                    </Typography>
                )}
            </Box>

            {/* Confirmation Dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {pendingDeleteId
                            ? 'Are you sure you want to delete this metric? This action cannot be undone.'
                            : `Are you sure you want to delete ${selectedIds.length} selected metric(s)? This action cannot be undone.`}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={executeDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={!!snackbarMsg}
                autoHideDuration={3000}
                onClose={() => setSnackbarMsg(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" variant="filled" onClose={() => setSnackbarMsg(null)}>
                    {snackbarMsg}
                </Alert>
            </Snackbar>
        </Box>
    );
}
