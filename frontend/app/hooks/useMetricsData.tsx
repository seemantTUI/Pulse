import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
    const abortRef = useRef<AbortController | null>(null);

    const fetchMetrics = useCallback(async () => {
        if (status !== 'authenticated' || !session?.accessToken) return;

        setLoading(true);
        abortRef.current?.abort(); // Abort previous request
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/metrics`, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                signal: controller.signal
            });

            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            const items: Metric[] = Array.isArray(data)
                ? data
                : Array.isArray(data.metrics?.items)
                    ? data.metrics.items
                    : [];

            setMetrics(items);
        } catch (err) {
            if ((err as any).name !== 'AbortError') {
                setMetrics([]);
            }
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken, status]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchMetrics();
        }
        return () => {
            abortRef.current?.abort();
        };
    }, [fetchMetrics, status]);

    const deleteMetric = useCallback(
        async (id: string) => {
            if (status !== 'authenticated' || !session?.accessToken) return;

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/metrics/${id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (res.ok) {
                    setMetrics((prev) => prev.filter((m) => m._id !== id));
                }
            } catch {
                // do nothing
            }
        },
        [session?.accessToken, status]
    );

    const rows = useMemo(() => metrics.map((m) => ({ ...m, id: m._id })), [metrics]);

    const columns: GridColDef[] = useMemo(() => [
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
    ], []);

    return { rows, columns, loading, deleteMetric, refetch: fetchMetrics };
}
