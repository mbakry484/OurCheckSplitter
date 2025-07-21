import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box } from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';

const AddReceiptModal = ({ open, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [tax, setTax] = useState('');
    const [tips, setTips] = useState('');

    const handleSave = () => {
        onSave({ name, tax: parseFloat(tax) || 0, tips: parseFloat(tips) || 0 });
        setName('');
        setTax('');
        setTips('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 2, p: 2, minWidth: 350 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                <ReceiptIcon color="primary" sx={{ fontSize: 32 }} /> Add New Receipt
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField label="Receipt Name" placeholder="e.g. Birthday Dinner" value={name} onChange={e => setName(e.target.value)} fullWidth required />
                    <TextField label="Tax" placeholder="e.g. 10.00" value={tax} onChange={e => setTax(e.target.value)} type="number" fullWidth InputProps={{ startAdornment: <span>$</span> }} />
                    <TextField label="Tips" placeholder="e.g. 15.00" value={tips} onChange={e => setTips(e.target.value)} type="number" fullWidth InputProps={{ startAdornment: <span>$</span> }} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary" sx={{ fontWeight: 'bold' }}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddReceiptModal; 