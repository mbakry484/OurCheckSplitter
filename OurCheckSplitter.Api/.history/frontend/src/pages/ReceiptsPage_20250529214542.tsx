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
      <Typography variant="h4" gutterBottom color="primary">Receipts</Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ color: '#26a69a', mb: 3 }}>
        Split bills, track friends, and never lose a cent.
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {receipts.map((receipt) => (
          <Grid item xs={12} sm={6} md={4} key={receipt.id}>
            <Card
              sx={{
                borderRadius: 5,
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
                background: 'rgba(255,255,255,0.35)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.03)',
                  boxShadow: '0 16px 40px 0 rgba(44,62,80,0.18)',
                },
              }}
            >
              <CardContent>
                <Typography variant="h6" color="secondary" gutterBottom>{receipt.name}</Typography>
                <Typography variant="body1">Total: ${receipt.total.toFixed(2)}</Typography>
              </CardContent>
              <CardActions>
                <Button variant="contained" color="primary" size="small" disabled>View Details</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Fab color="success" aria-label="add" sx={{ position: 'absolute', bottom: -32, right: 24, boxShadow: 4 }} onClick={() => setOpen(true)}>
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
          <Button onClick={handleAdd} variant="contained" color="success">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 