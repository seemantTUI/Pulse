// app/(dashboard)/notifications/page.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { GridColDef } from '@mui/x-data-grid';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import CustomDataGrid from '../../components/CustomDataGrid';
import useNotificationsData from '../../hooks/useNotificationsData';

export default function NotificationsPage() {
    const router = useRouter();
    const { rows, columns, loading } = useNotificationsData();

    const handleAdd = () => {
        router.push('/notifications/add');
    };

    return (
        <Box p={2}>
            <Box mb={2} display="flex" justifyContent="flex-end">
            </Box>
            <CustomDataGrid rows={rows} columns={columns} loading={loading} />
        </Box>
    );
}
