'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export interface RuleBreachLog {
    _id: string;
    ruleId: { _id: string; ruleName: string };
    value: number;
    triggeredAt: string;
}

export default function useRuleBreachLogs(ruleId: string) {
    const [logs, setLogs] = useState<RuleBreachLog[]>([]);
    const [loading, setLoading] = useState(false);
    const { data: session, status } = useSession();

    useEffect(() => {
        let cancelled = false;

        // Clear on id/status change for immediate feedback
        setLogs([]);
        setLoading(false);

        if (!ruleId || status !== 'authenticated') {
            return;
        }

        const fetchLogs = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/rule-breach-logs/${ruleId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${session?.accessToken}`,
                        },
                    }
                );

                const data = await res.json();

                if (!cancelled) {
                    const items: RuleBreachLog[] = Array.isArray(data.items)
                        ? data.items.reverse()
                        : [];
                    setLogs(items);
                }
            } catch (err) {
                if (!cancelled) setLogs([]);
                console.error('Failed to fetch rule breach logs:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchLogs();

        return () => {
            cancelled = true;
        };
    }, [ruleId, session?.accessToken, status]);

    return { logs, loading };
}
