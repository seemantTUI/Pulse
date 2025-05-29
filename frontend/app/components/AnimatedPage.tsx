// components/AnimatedPage.tsx
'use client';
import * as React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedPage({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            style={{ minHeight: '100vh' }}
        >
            {children}
        </motion.div>
    );
}
