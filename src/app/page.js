'use client'

import { useEffect, useState } from 'react';
import {
  Box,
  Collapse,
  Grid,
  IconButton,
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
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { DataGrid } from '@mui/x-data-grid';

const API = 'https://trader-module-production.up.railway.app';

function SymbolRow({ symbol, records }) {
  const [open, setOpen] = useState(false);
  const latest = records[0];
  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ width: 48 }}>
          <IconButton size="small" onClick={() => setOpen(o => !o)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">{symbol}</TableCell>
        <TableCell>{latest.price}</TableCell>
        <TableCell>{latest.time}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="subtitle2" gutterBottom>History</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Price</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.price}</TableCell>
                      <TableCell>{r.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

const symbolColumns = [
  { field: 'symbol', headerName: 'Symbol', flex: 1 },
];

const newsColumns = [
  { field: 'tags', headerName: 'Symbol', width: 120 },
  { field: 'published_at', headerName: 'Published', width: 180 },
  { field: 'summary', headerName: 'Summary', flex: 1 },
];

export default function Home() {
  const [data, setData] = useState({});
  const [symbols, setSymbols] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [marketOpen, setMarketOpen] = useState(null);

  const fetchPrices = () => {
    fetch(`${API}/prices/latest`)
      .then(res => res.json())
      .then(rows => {
        const mapped = rows.map(row => ({
          symbol: row.symbol,
          price: row.price,
          time: new Date(row.created_at).toLocaleString(),
        }));
        // Group by symbol, preserving insertion order (latest first per symbol)
        const grouped = {};
        for (const r of mapped) {
          if (!grouped[r.symbol]) grouped[r.symbol] = [];
          grouped[r.symbol].push(r);
        }
        setData(grouped);
        setSymbols(Object.keys(grouped).map((sym, i) => ({ id: i, symbol: sym })));
      });
  };

  const fetchMarketStatus = () => {
    fetch(`${API}/market/status`)
      .then(res => res.json())
      .then(data => setMarketOpen(data.open))
      .catch(() => setMarketOpen(null));
  };

  const fetchNews = () => {
    fetch(`${API}/news/latest`)
      .then(res => res.json())
      .then(rows => Array.isArray(rows) && setNews(rows.map((row, i) => ({
        id: i,
        tags: (row.tags || []).join(', ') || '—',
        published_at: row.published_at ? new Date(row.published_at).toLocaleString() : '—',
        summary: row.summary || '—',
      }))))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPrices();
    fetchMarketStatus();
    fetchNews();
    const interval = setInterval(fetchMarketStatus, 60_000);
    const newsInterval = setInterval(fetchNews, 5 * 60_000);
    return () => {
      clearInterval(interval);
      clearInterval(newsInterval);
    };
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
    <Box sx={{ p: 3, boxSizing: 'border-box' }}>
      <Grid container spacing={2}>

        {/* Market Data — 2/3 */}
        <Grid size={8}>
          <Paper sx={{ p: 2 }}>
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
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Symbol</TableCell>
                    <TableCell>Latest Price</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(data).map(([symbol, records]) => (
                    <SymbolRow key={symbol} symbol={symbol} records={records} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Tracked Companies — 1/3 */}
        <Grid size={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
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

            <DataGrid
              rows={symbols}
              columns={symbolColumns}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              pageSizeOptions={[5, 10]}
              sx={{ border: 0 }}
              autoHeight
            />
          </Paper>
        </Grid>

        {/* News Articles — full width */}
        <Grid size={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>News</Typography>
            <DataGrid
              rows={news}
              columns={newsColumns}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              pageSizeOptions={[5, 10, 25]}
              sx={{ border: 0 }}
              autoHeight
            />
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