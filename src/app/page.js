'use client'

import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';

const API = 'https://trader-module-production.up.railway.app';

export default function Home() {
  const [data, setData] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [marketOpen, setMarketOpen] = useState(null);

  const fetchPrices = () => {
    fetch(`${API}/prices/latest`)
      .then(res => res.json())
      .then(rows => {
        const mapped = rows.map((row, i) => ({
          key: String(i),
          symbol: row.symbol,
          price: row.price,
          time: new Date(row.created_at).toLocaleString(),
        }));
        setData(mapped);
        setSymbols([...new Map(mapped.map(r => [r.symbol, r])).values()]);
      });
  };

  const fetchMarketStatus = () => {
    fetch(`${API}/market/status`)
      .then(res => res.json())
      .then(data => setMarketOpen(data.open))
      .catch(() => setMarketOpen(null));
  };

  useEffect(() => {
    fetchPrices();
    fetchMarketStatus();
    const interval = setInterval(fetchMarketStatus, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleAddSymbol = async () => {
    const symbol = input.trim().toUpperCase();
    if (!symbol) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/symbols`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      if (res.status === 409) {
        setSnackbar({ open: true, message: `${symbol} is already tracked`, severity: 'warning' });
      } else if (!res.ok) {
        setSnackbar({ open: true, message: 'Failed to add symbol', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: `${symbol} added`, severity: 'success' });
        setInput('');
        fetchPrices();
      }
    } catch {
      setSnackbar({ open: true, message: 'Network error', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, height: '100vh', boxSizing: 'border-box' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>

        {/* Market Data — 2/3 */}
        <Grid size={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h6">Market Data</Typography>
              {marketOpen !== null && (
                <Chip
                  size="small"
                  label={marketOpen ? 'Open' : 'Closed'}
                  sx={{
                    bgcolor: marketOpen ? '#4caf50' : '#f44336',
                    color: '#fff',
                    fontWeight: 600,
                    '& .MuiChip-label': { px: 1.5 },
                  }}
                />
              )}
            </Box>
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map(row => (
                    <TableRow key={row.key} hover>
                      <TableCell>{row.symbol}</TableCell>
                      <TableCell>{row.price}</TableCell>
                      <TableCell>{row.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Tracked Companies — 1/3 */}
        <Grid size={4}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Tracked Companies</Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="e.g. NVDA"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSymbol()}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleAddSymbol}
                disabled={loading}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {loading ? <CircularProgress size={20} /> : 'Add'}
              </Button>
            </Box>

            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {symbols.map(row => (
                    <TableRow key={row.symbol} hover>
                      <TableCell>{row.symbol}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
