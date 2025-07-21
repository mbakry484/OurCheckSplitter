import React from 'react';
import Navbar from '../components/Navbar';
import { Box, Typography } from '@mui/material';
import BackgroundCharacters from '../components/BackgroundCharacters';

const ReceiptDetailsPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0eafc 100%)', position: 'relative', zIndex: 1 }}>
            <BackgroundCharacters />
            <Navbar />
            <Box sx={{ p: 4, position: 'relative', zIndex: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                    Receipt Details
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Here you will manage friends, items, and assignments for this receipt.
                </Typography>
            </Box>
        </Box>
    );
};

export default ReceiptDetailsPage; 