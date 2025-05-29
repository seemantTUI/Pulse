'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, IconButton, Button, Checkbox, Typography,
    Dialog, DialogTitle, DialogContent, DialogContentText,
    DialogActions, Snackbar, Alert, Menu, MenuItem, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplayIcon from '@mui/icons-material/Replay';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { GridColDef } from '@mui/x-data-grid';
import CustomDataGrid from '../../components/CustomDataGrid';
import useRulesData from '../../hooks/useRulesData';

export default function RulesPage() {
    const router = useRouter();
    const {
        rows, columns: baseCols, loading,
        armRule, disarmRule, armRules, disarmRules,
        deleteRule, deleteRules
    } = useRulesData();

    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
    const [dialogMode, setDialogMode] = React.useState<'single' | 'multiple'>('multiple');
    const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
    const [snackbarMsg, setSnackbarMsg] = React.useState<string | null>(null);

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const handleBulkMenuClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleBulkMenuClose = () => setAnchorEl(null);

    const toggleSelect = (id: string) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleEdit = (id: string) => router.push(`/rules/add?id=${id}`);
    const handleCopy = (id: string) => router.push(`/rules/add?copyFrom=${id}`);

    const confirmDelete = (id: string) => {
        setDialogMode('single');
        setPendingDeleteId(id);
        setConfirmDialogOpen(true);
    };

    const confirmBulkDelete = () => {
        setDialogMode('multiple');
        setConfirmDialogOpen(true);
    };

    const executeDelete = async () => {
        if (dialogMode === 'single' && pendingDeleteId) {
            await deleteRule(pendingDeleteId);
            setSnackbarMsg('Rule deleted successfully');
        } else if (dialogMode === 'multiple') {
            await deleteRules(selectedIds);
            setSnackbarMsg(`${selectedIds.length} rule(s) deleted`);
            setSelectedIds([]);
        }
        setConfirmDialogOpen(false);
        setPendingDeleteId(null);
    };

    const handleBulkArm = async () => {
        const toArm = rows.filter(r => selectedIds.includes(r._id) && !r.isArmed).map(r => r._id);
        if (!toArm.length) return setSnackbarMsg('All selected rules are already armed');
        await armRules(toArm);
        setSnackbarMsg(`${toArm.length} rule(s) armed`);
    };

    const handleBulkDisarm = async () => {
        const toDisarm = rows.filter(r => selectedIds.includes(r._id) && r.isArmed).map(r => r._id);
        if (!toDisarm.length) return setSnackbarMsg('All selected rules are already disarmed');
        await disarmRules(toDisarm);
        setSnackbarMsg(`${toDisarm.length} rule(s) disarmed`);
    };

    const selectCol: GridColDef = {
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
    };

    const actionsCol: GridColDef = React.useMemo(
        () => ({
            field: 'actions',
            headerName: 'Actions',
            sortable: false,
            filterable: false,
            flex: 1,
            minWidth: 180,
            renderCell: ({ row }) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit Rule">
                        <IconButton onClick={() => handleEdit(row.id)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Copy Rule">
                        <IconButton onClick={() => handleCopy(row.id)}><ContentCopyIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Rule">
                        <IconButton onClick={() => confirmDelete(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={row.isArmed ? 'Disarm Rule' : 'Arm Rule'}>
                        <IconButton onClick={() => row.isArmed ? disarmRule(row.id) : armRule(row.id)}>
                            {row.isArmed ? <BlockIcon fontSize="small" /> : <ReplayIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }),
        [armRule, disarmRule, deleteRule]
    );

    return (
        <Box p={2}>
            <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                <Box flex={1}>
                    <Typography variant="h6" sx={{ mb: 1 }}></Typography>
                </Box>
                <Box display="flex" gap={1}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/rules/add')}>
                        Add Rule
                    </Button>
                    <Button variant="outlined" onClick={handleBulkMenuClick} endIcon={<MoreVertIcon />} disabled={!selectedIds.length}>
                        Bulk Actions
                    </Button>
                </Box>
            </Box>

            <Box mb={2}>
                <CustomDataGrid
                    rows={rows}
                    columns={[selectCol, ...baseCols, actionsCol]}
                    loading={loading}
                    autoHeight
                />
                {selectedIds.length > 0 && (
                    <Typography
                        variant="caption"
                        sx={{ mt: 1, ml: 1, display: 'block' }}
                    >
                        {selectedIds.length} rule{selectedIds.length > 1 ? 's' : ''} selected
                    </Typography>
                )}
            </Box>

            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleBulkMenuClose}>
                <MenuItem onClick={() => { confirmBulkDelete(); handleBulkMenuClose(); }}>
                    Delete Selected
                </MenuItem>
                <MenuItem onClick={() => { handleBulkArm(); handleBulkMenuClose(); }}>
                    Arm Selected
                </MenuItem>
                <MenuItem onClick={() => { handleBulkDisarm(); handleBulkMenuClose(); }}>
                    Disarm Selected
                </MenuItem>
            </Menu>

            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete {dialogMode === 'single' ? 'this rule' : 'the selected rules'}?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                    <Button onClick={executeDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

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
