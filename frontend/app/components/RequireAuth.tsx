'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/signin');
        }
    }, [router]);

    return <>{children}</>;
}
