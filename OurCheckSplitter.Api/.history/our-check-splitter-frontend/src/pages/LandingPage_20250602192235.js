import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Box, Grid, Card, CardContent, Typography, Fab, CircularProgress, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AddReceiptModal from '../components/AddReceiptModal';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LandingPage = () => {
    const [open, setOpen] = useState(false);
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchReceipts = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get('/api/receipt');
                setReceipts(res.data);
            } catch (err) {
                setError('Failed to load receipts.');
            } finally {
                setLoading(false);
            }
        };
        fetchReceipts();
    }, []);

    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
            <Navbar />
            <Box sx={{ p: 4 }}>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
                    Past Receipts
                </Typography>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <Grid container spacing={3}>
                        {receipts.map(receipt => (
                            <Grid item xs={12} sm={6} md={4} key={receipt.id}>
                                <Card
                                    sx={{ borderRadius: 2, boxShadow: 4, transition: '0.2s', '&:hover': { boxShadow: 8, transform: 'scale(1.03)', cursor: 'pointer' } }}
                                    onClick={() => navigate(`/receipt/${receipt.id}`)}
                                >
                                    <CardContent>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{receipt.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{receipt.date || ''}</Typography>
                                        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>${receipt.total?.toFixed(2) ?? '0.00'}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
                {/* Floating Add Button */}
                <Fab color="secondary" aria-label="add" sx={{ position: 'fixed', bottom: 32, right: 32, boxShadow: 6 }} onClick={() => setOpen(true)}>
                    <AddIcon sx={{ fontSize: 32 }} />
                </Fab>
                <AddReceiptModal
                    open={open}
                    onClose={() => setOpen(false)}
                    onSave={newReceipt => setReceipts([...receipts, { ...newReceipt, id: receipts.length + 1, date: new Date().toISOString().slice(0, 10), total: 0 }])}
                />
            </Box>
        </Box>
    );
};

export default LandingPage; 