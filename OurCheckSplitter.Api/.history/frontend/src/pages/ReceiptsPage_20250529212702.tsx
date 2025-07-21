import React from 'react';
import { Card, CardContent, Typography, Grid, Button, CardActions, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Fab from '@mui/material/Fab';

const mockReceipts = [
  { id: 1, name: 'Birthday Dinner', total: 120.5 },
  { id: 2, name: 'Office Lunch', total: 75.0 },
  { id: 3, name: 'Grocery Run', total: 42.3 },
];

export default function ReceiptsPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom color="primary">Receipts</Typography>
      <Grid container spacing={3}>
        {mockReceipts.map((receipt) => (
          <Grid item xs={12} sm={6} md={4} key={receipt.id}>
            <Card sx={{ borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #ede7f6 100%)' }}>
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
      <Fab color="success" aria-label="add" sx={{ position: 'fixed', bottom: 32, right: 32, boxShadow: 4 }}>
        <AddIcon />
      </Fab>
    </Box>
  );
} 