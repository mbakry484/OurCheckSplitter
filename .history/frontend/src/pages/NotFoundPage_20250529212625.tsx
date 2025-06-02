import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Box textAlign="center" mt={8}>
      <Typography variant="h2" color="error" gutterBottom>404</Typography>
      <Typography variant="h5" gutterBottom>Page Not Found</Typography>
      <Button variant="contained" color="secondary" component={Link} to="/">Go to Receipts</Button>
    </Box>
  );
} 