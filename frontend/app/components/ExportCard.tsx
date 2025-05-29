'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';

export default function HighlightedCard() {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const router = useRouter();

    return (
        <Card sx={{ height: '100%' }} variant="outlined">
            <CardContent>
                <FileDownloadRoundedIcon />
                <Typography component="h2" variant="subtitle2" gutterBottom sx={{ fontWeight: '600' }}>
                    Export your data
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: '8px' }}>
                    Download metrics, rules, and notifications for reporting and analysis.
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    endIcon={<DownloadIcon />}
                    fullWidth={isSmallScreen}
                    onClick={() => router.push('/data/export')}
                >
                    Export Data
                </Button>
            </CardContent>
        </Card>
    );
}
