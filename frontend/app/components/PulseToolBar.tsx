import { Box } from '@mui/material';
import React from 'react';

export function PulseLogo() {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <svg
                width="36"
                height="20"
                viewBox="0 0 36 20"
                fill="none"
                style={{ display: 'block', height: 28, width: 'auto' }}
                aria-label="Pulse logo"
            >
                <polyline
                    points="2,12 9,12 13,4 18,18 23,12 34,12"
                    fill="none"
                    stroke="#2066e6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </Box>
    );
}
