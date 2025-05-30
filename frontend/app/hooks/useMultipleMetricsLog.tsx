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

export default function useMultipleMetricHistories(metricIds: string[]) {
    const [logsById, setLogsById] = useState<Record<string, MetricLog[]>>({});
    const [loading, setLoading] = useState(false);
    const { data: session, status } = useSession();

    useEffect(() => {
        if (!metricIds.length || status !== 'authenticated') {
            setLogsById({});
            setLoading(false);
            return;
        }

        let cancelled = false;
        const fetchLogs = async () => {
            setLoading(true);
            try {
                // Fetch logs for all metricIds in parallel
                const results = await Promise.all(
                    metricIds.map(id =>
                        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/metric-logs/${id}`, {
                            headers: {
                                Authorization: `Bearer ${session?.accessToken}`,
                            }
                        }).then(res =>
                            [id, Array.isArray(res.data.items) ? res.data.items.reverse() : []] as [string, MetricLog[]]
                        ).catch(() => [id, []] as [string, MetricLog[]])
                    )
                );

                if (cancelled) return;
                const logsObj: Record<string, MetricLog[]> = {};
                results.forEach(([id, items]) => { logsObj[id] = items; });
                setLogsById(logsObj);
            } catch (err) {
                if (!cancelled) setLogsById({});
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void fetchLogs(); // Silences the warning about ignored promise
        return () => { cancelled = true; };
        // Note: using metricIds.join(',') can cause bugs if metricIds contain commas;
        // for safety, use metricIds as a dependency directly:
    }, [JSON.stringify(metricIds), session, status]);

    return { logsById, loading };
}
