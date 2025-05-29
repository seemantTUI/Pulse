'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { GridColDef } from '@mui/x-data-grid';

export interface Rule {
    _id: string;
    ruleName: string;
    ruleDescription?: string;
    alertMessage?: string;
    isArmed: boolean;
    retriggerAfter?: string;
    lastTriggeredAt?: string;
    createdAt: string;
}

// ✅ Safe header helper
const getAuthHeaders = (token?: string): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function useRulesData() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== 'authenticated') return;

        let isMounted = true;

        (async () => {
            try {
                const res = await fetch('http://localhost:4000/api/v1/rules', {
                    headers: getAuthHeaders(session?.accessToken),
                });
                const data = await res.json();

                if (!isMounted) return;

                const items: Rule[] = Array.isArray(data)
                    ? data
                    : Array.isArray(data.rules?.items)
                        ? data.rules.items
                        : [];

                setRules(items);
            } catch {
                if (isMounted) setRules([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [session, status]);

    const updateArmedState = useCallback((ids: string[], state: boolean) => {
        setRules(prev =>
            prev.map(r => (ids.includes(r._id) ? { ...r, isArmed: state } : r))
        );
    }, []);

    const armRule = useCallback(
        async (id: string) => {
            try {
                const res = await fetch(`http://localhost:4000/api/v1/rules/${id}/arm`, {
                    method: 'PATCH',
                    headers: getAuthHeaders(session?.accessToken),
                });
                if (res.ok) updateArmedState([id], true);
            } catch {
                console.error('Error arming rule');
            }
        },
        [session, updateArmedState]
    );

    const disarmRule = useCallback(
        async (id: string) => {
            try {
                const res = await fetch(`http://localhost:4000/api/v1/rules/${id}/disarm`, {
                    method: 'PATCH',
                    headers: getAuthHeaders(session?.accessToken),
                });
                if (res.ok) updateArmedState([id], false);
            } catch {
                console.error('Error disarming rule');
            }
        },
        [session, updateArmedState]
    );

    const armRules = useCallback(
        async (ids: string[]) => {
            try {
                const res = await fetch('http://localhost:4000/api/v1/rules/bulk-arm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders(session?.accessToken),
                    },
                    body: JSON.stringify({ ids }),
                });
                if (res.ok) updateArmedState(ids, true);
            } catch {
                console.error('Error bulk arming rules');
            }
        },
        [session, updateArmedState]
    );

    const disarmRules = useCallback(
        async (ids: string[]) => {
            try {
                const res = await fetch('http://localhost:4000/api/v1/rules/bulk-disarm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders(session?.accessToken),
                    },
                    body: JSON.stringify({ ids }),
                });
                if (res.ok) updateArmedState(ids, false);
            } catch {
                console.error('Error bulk disarming rules');
            }
        },
        [session, updateArmedState]
    );

    const deleteRule = useCallback(
        async (id: string) => {
            try {
                const res = await fetch(`http://localhost:4000/api/v1/rules/${id}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(session?.accessToken),
                });
                if (res.ok) {
                    setRules(prev => prev.filter(r => r._id !== id));
                }
            } catch {
                console.error('Error deleting rule');
            }
        },
        [session]
    );

    const getRuleById = useCallback(
        async (id: string) => {
            try {
                const res = await fetch(`http://localhost:4000/api/v1/rules/${id}`, {
                    headers: getAuthHeaders(session?.accessToken),
                });
                if (!res.ok) throw new Error('Failed to fetch rule');
                return await res.json();
            } catch (err) {
                console.error(`Error fetching rule ${id}:`, err);
                return null;
            }
        },
        [session]
    );

    const deleteRules = useCallback(
        async (ids: string[]) => {
            if (!ids.length) return;
            try {
                const res = await fetch('http://localhost:4000/api/v1/rules/bulk-delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders(session?.accessToken),
                    },
                    body: JSON.stringify({ ids }),
                });
                if (res.ok) {
                    setRules(prev => prev.filter(r => !ids.includes(r._id)));
                } else {
                    console.error('Bulk delete failed');
                }
            } catch (err) {
                console.error('Error bulk-deleting rules:', err);
            }
        },
        [session]
    );

    const rows = rules.map(r => ({
        ...r,
        id: r._id,
        lastTriggeredAt: r.lastTriggeredAt ? new Date(r.lastTriggeredAt) : null,
    }));

    const columns: GridColDef[] = [
        { field: 'ruleName', headerName: 'Rule Name', flex: 1, minWidth: 100 },
        { field: 'isArmed', headerName: 'Armed', type: 'boolean', flex: 1, minWidth: 100 },
        { field: 'retriggerAfter', headerName: 'Retrigger After', flex: 1, minWidth: 150 },
        {
            field: 'lastTriggeredAt',
            headerName: 'Last Triggered At',
            type: 'dateTime',
            flex: 1,
            minWidth: 160,
        },
    ];

    return {
        rows,
        columns,
        loading,
        armRule,
        disarmRule,
        armRules,
        disarmRules,
        deleteRule,
        deleteRules,
        getRuleById,
    };
}
