'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { GridColDef } from '@mui/x-data-grid';

export interface Notification {
    _id: string;
    message: string;
    ruleId?: { _id: string; ruleName: string };
    createdAt: string;
}

export default function useNotificationsData() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== 'authenticated') return;

        let isMounted = true;

        (async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/`, {
                    headers: {
                        Authorization: `Bearer ${session?.accessToken}`,
                    },
                });

                const data = await res.json();
                if (!isMounted) return;

                const items: Notification[] = Array.isArray(data)
                    ? data
                    : Array.isArray(data.notifications?.items)
                        ? data.notifications.items
                        : [];

                setNotifications(items);
            } catch (err) {
                console.error('Error fetching notifications:', err);
                if (isMounted) setNotifications([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [session, status]);

    const rows = notifications.map((n, idx) => ({
        ...n,
        id: n._id,
        index: idx + 1,
        createdAt: new Date(n.createdAt),
    }));

    const columns: GridColDef[] = [
        {
            field: 'index',
            headerName: '#',
            width: 80,
            sortable: false,
            filterable: false,
        },
        {
            field: 'message',
            headerName: 'Message',
            flex: 1,
            minWidth: 200,
        },
        {
            field: 'ruleId',
            headerName: 'Associated Rule',
            flex: 1.5,
            minWidth: 200,
            sortable: false,
            filterable: false,
            renderCell: (params: any) => {
                const rule = params.row.ruleId;
                if (!rule) {
                    return 'No Associated Rule';
                }
                return (
                    <a
                        href={`/rules/${rule._id}?view_only=true`}
                        style={{ textDecoration: 'none', color: '#1976d2' }}
                    >
                        {rule.ruleName}
                    </a>
                );
            },
        },
        {
            field: 'createdAt',
            headerName: 'Sent At',
            type: 'dateTime',
            flex: 1.5,
            minWidth: 180,
        },
    ];

    return { rows, columns, loading };
}
