'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { GridColDef } from '@mui/x-data-grid';

export interface Metric {
    _id: string;
    metricName: string;
    value: number;
}

export default function useMetricsData() {
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [loading, setLoading] = useState(true);
    const { data: session, status } = useSession();

    const fetchMetrics = useCallback(async () => {
        if (status !== 'authenticated' || !session?.accessToken) return;

        setLoading(true);
        try {
            const res = await fetch('http://localhost:4000/api/v1/metrics/', {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            const data = await res.json();

            const items: Metric[] = Array.isArray(data)
                ? data
                : Array.isArray(data.metrics?.items)
                    ? data.metrics.items
                    : [];

            setMetrics(items);
        } catch (err) {
            console.error('Error fetching metrics:', err);
            setMetrics([]);
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken, status]);

    useEffect(() => {
        let isMounted = true;
        if (status === 'authenticated') {
            fetchMetrics().then(() => {
                if (!isMounted) setLoading(false);
            });
        }

        return () => {
            isMounted = false;
        };
    }, [fetchMetrics, status]);

    const deleteMetric = useCallback(
        async (id: string) => {
            if (status !== 'authenticated' || !session?.accessToken) return;

            try {
                const res = await fetch(`http://localhost:4000/api/v1/metrics/${id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (res.ok) {
                    setMetrics((prev) => prev.filter((m) => m._id !== id));
                }
            } catch {
                console.error('Error deleting metric');
            }
        },
        [session?.accessToken, status]
    );

    const rows = metrics.map((m) => ({
        ...m,
        id: m._id,
    }));

    const columns: GridColDef[] = [
        {
            field: 'metricName',
            headerName: 'Metric Name',
            flex: 1,
            minWidth: 100,
        },
        {
            field: 'value',
            headerName: 'Value',
            type: 'number',
            flex: 1,
            minWidth: 120,
        },
    ];

    return { rows, columns, loading, deleteMetric, refetch: fetchMetrics };
}
