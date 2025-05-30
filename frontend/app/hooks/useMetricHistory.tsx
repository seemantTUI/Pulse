import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';

interface MetricLog {
    _id: string;
    metricId: string;
    value: number;
    createdAt: string;
    updatedAt: string;
}

export default function useMetricHistory(metricId: string) {
    const [logs, setLogs] = useState<MetricLog[]>([]);
    const [loading, setLoading] = useState(false);
    const { data: session, status } = useSession();

    useEffect(() => {
        if (!metricId || status !== 'authenticated') {
            setLogs([]);
            return;
        }

        let cancelled = false;

        const fetchLogs = async () => {
            setLoading(true);
            try {
                const res = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/metric-logs/${metricId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${session?.accessToken}`,
                        },
                    }
                );

                if (cancelled) return;

                const items: MetricLog[] = Array.isArray(res.data.items)
                    ? res.data.items.reverse()
                    : [];

                setLogs(items);
            } catch (err) {
                console.error('Failed to fetch metric logs:', err);
                if (!cancelled) setLogs([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchLogs();

        return () => {
            cancelled = true;
        };
    }, [metricId, session, status]);

    return { logs, loading };
}