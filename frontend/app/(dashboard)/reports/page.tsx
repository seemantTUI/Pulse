// app/reports/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportsHome() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/reports/metrics');
    }, [router]);

    return null;
}

