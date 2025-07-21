import React from 'react';
import { Card, CardContent, Typography, Grid, Button, CardActions, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Fab from '@mui/material/Fab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';

const mockReceipts = [
  { id: 1, name: 'Birthday Dinner', total: 120.5 },
  { id: 2, name: 'Office Lunch', total: 75.0 },
  { id: 3, name: 'Grocery Run', total: 42.3 },
];

export default function ReceiptsPage() {
  const [open, setOpen] = React.useState(false);
  const [receipts, setReceipts] = React.useState(mockReceipts);
  const [newName, setNewName] = React.useState('');
  const [newTotal, setNewTotal] = React.useState('');

  const handleAdd = () => {
    if (!newName || !newTotal) return;
    setReceipts([...receipts, { id: receipts.length + 1, name: newName, total: parseFloat(newTotal) }]);
    setNewName('');
    setNewTotal('');
    setOpen(false);
  };

  return (
    <Box sx={{ position: 'relative', minHeight: 400 }}>
      <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 900, letterSpacing: 2, color: '#00e6e6', textShadow: '0 2px 16px #00e6e6' }}>Receipts</Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ color: '#ff2e88', mb: 3, fontWeight: 600, fontSize: 20 }}>
        Split bills, track friends, and never lose a cent.
      </Typography>
      <Grid container spacing={5} justifyContent="center">
        {receipts.map((receipt) => (
          <Grid item xs={12} sm={8} md={6} key={receipt.id}>
            <Card
              sx={{
                borderRadius: 6,
                boxShadow: '0 8px 32px 0 #00e6e6, 0 2px 32px 0 #ff2e88',
                background: 'rgba(24,28,36,0.85)',
                border: '2px solid',
                borderImage: 'linear-gradient(90deg, #00e6e6 0%, #ff2e88 100%) 1',
                color: '#fff',
                backdropFilter: 'blur(12px)',
                transition: 'transform 0.18s, box-shadow 0.18s',
                '&:hover': {
                  transform: 'scale(1.04) rotate(-1deg)',
                  boxShadow: '0 16px 40px 0 #ff2e88, 0 2px 32px 0 #00e6e6',
                },
              }}
            >
              <CardContent>
                <Typography variant="h5" color="primary" gutterBottom sx={{ fontWeight: 800, letterSpacing: 1, color: '#00e6e6', textShadow: '0 2px 8px #00e6e6' }}>{receipt.name}</Typography>
                <Typography variant="h6" sx={{ color: '#ff2e88', fontWeight: 700 }}>Total: ${receipt.total.toFixed(2)}</Typography>
              </CardContent>
              <CardActions>
                <Button variant="contained" color="secondary" size="large" disabled sx={{ fontWeight: 700, borderRadius: 3 }}>View Details</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Fab color="primary" aria-label="add" sx={{
        position: 'absolute',
        bottom: -32,
        right: 24,
        boxShadow: '0 0 24px 8px #00e6e6, 0 0 32px 8px #ff2e88',
        background: 'linear-gradient(90deg, #00e6e6 0%, #ff2e88 100%)',
        color: '#fff',
        fontWeight: 900,
        animation: 'bounce 1.2s infinite',
        '@keyframes bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      }} onClick={() => setOpen(true)}>
        <AddIcon />
      </Fab>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Receipt</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Receipt Name"
            fullWidth
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Total Amount"
            type="number"
            fullWidth
            value={newTotal}
            onChange={e => setNewTotal(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" color="primary">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 