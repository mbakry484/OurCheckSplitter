import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';

const Navbar = () => {
    return (
        <AppBar position="static" color="primary" sx={{ boxShadow: 3 }}>
            <Toolbar>
                <RestaurantMenuIcon sx={{ mr: 2, fontSize: 32, color: '#fff' }} />
                <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: 2 }}>
                    Our Check Splitter
                </Typography>
                <Box>
                    <Button color="inherit" sx={{ mr: 1, fontWeight: 'bold' }}>Login</Button>
                    <Button variant="contained" color="secondary" sx={{ fontWeight: 'bold', boxShadow: 2 }}>
                        Sign Up
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar; 