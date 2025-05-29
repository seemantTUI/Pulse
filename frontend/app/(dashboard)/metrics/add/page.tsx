'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Card,
    CardContent,
    useTheme,
} from '@mui/material';

export default function AddEditMetricPage() {
    const router = useRouter();
    const search = useSearchParams();
    const id = search.get('id');
    const readOnly = search.get('view_only') === 'true';

    const { data: session, status } = useSession();
    const accessToken = session?.accessToken;

    const theme = useTheme();
    const cardBgColor = theme.palette.mode === 'dark' ? '#1e1e1e' : '#f9f9f9';

    const [name, setName] = useState('');
    const [value, setValue] = useState<number | ''>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id || !accessToken) return;

        fetch(`http://localhost:4000/api/v1/metrics/${id}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then((r) => r.json())
            .then((data) => {
                setName(data.metricName);
                setValue(data.value);
            })
            .catch((err) => {
                console.error('Error fetching metric:', err);
                setError('Failed to load metric');
            });
    }, [id, accessToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!accessToken) {
            setError('Not authenticated.');
            return;
        }

        const payload = { metricName: name, value };
        const url = id
            ? `http://localhost:4000/api/v1/metrics/${id}`
            : 'http://localhost:4000/api/v1/metrics';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                router.push('/metrics');
            } else {
                const body = await res.json();
                setError(body.error || 'Failed to save metric');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        }
    };

    return (
        <Box px={4} py={4} maxWidth={500}>
            <Card sx={{ background: cardBgColor, boxShadow: 3, width: '100%' }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        {id
                            ? readOnly
                                ? 'View Metric'
                                : 'Edit Metric'
                            : 'Add Metric'}
                    </Typography>

                    <Box
                        component="form"
                        onSubmit={readOnly ? (e) => e.preventDefault() : handleSubmit}
                        display="flex"
                        flexDirection="column"
                        alignItems="flex-start"
                        width="100%"
                    >
                        <TextField
                            label="Metric Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={readOnly}
                            required
                            margin="normal"
                            sx={{ width: 320 }}
                        />
                        <TextField
                            label="Value"
                            type="number"
                            value={value}
                            onChange={(e) => setValue(parseFloat(e.target.value) || '')}
                            disabled={readOnly}
                            required
                            margin="normal"
                            sx={{ width: 320 }}
                        />

                        {error && (
                            <Typography color="error" mt={1}>
                                {error}
                            </Typography>
                        )}

                        <Box mt={3} display="flex" gap={2}>
                            {!readOnly && (
                                <Button type="submit" variant="contained" disabled={status !== 'authenticated'}>
                                    {id ? 'Update Metric' : 'Create Metric'}
                                </Button>
                            )}
                            <Button variant="outlined" onClick={() => router.push('/metrics')}>
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
