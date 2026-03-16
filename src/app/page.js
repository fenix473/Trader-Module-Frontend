'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { DataGrid } from '@mui/x-data-grid';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from 'recharts';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: 'rgba(0,0,0,0)', paper: 'rgba(0,0,0,0)' },
    primary: { main: '#60a5fa' },
    text: { primary: '#ffffff', secondary: 'rgba(255,255,255,0.7)' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(165deg, rgba(18,22,40,0.88) 0%, rgba(8,10,24,0.92) 50%, rgba(12,16,32,0.9) 100%)',
          backdropFilter: 'blur(24px) saturate(1.2)',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'rgba(255,255,255,0.1)' },
        head: { color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { background: 'rgba(255,255,255,0.04)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(255,255,255,0.22)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: { color: 'rgba(255,255,255,0.7)' },
      },
    },
  },
});

const API = 'https://trader-module-production.up.railway.app';

const PAGE_SIZE = 10;

function SymbolRow({ symbol, latest }) {
  const [open, setOpen] = useState(false);
  const [pages, setPages] = useState({});   // { pageIndex: rows[] }
  const [page, setPage] = useState(0);
  const [histLoading, setHistLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = (pageIndex) => {
    if (pages[pageIndex] !== undefined) return;
    setHistLoading(true);
    fetch(`${API}/prices/${symbol}?limit=${PAGE_SIZE}&offset=${pageIndex * PAGE_SIZE}`)
      .then(res => res.json())
      .then(rows => {
        const mapped = rows.map(r => ({ price: r.price, time: new Date(r.created_at).toLocaleString() }));
        setPages(p => ({ ...p, [pageIndex]: mapped }));
        if (mapped.length < PAGE_SIZE) setHasMore(false);
      })
      .finally(() => setHistLoading(false));
  };

  const handleToggle = () => {
    if (!open && pages[0] === undefined) fetchPage(0);
    setOpen(o => !o);
  };

  const handleNext = () => {
    const next = page + 1;
    fetchPage(next);
    setPage(next);
  };

  const handlePrev = () => setPage(p => p - 1);

  const pageRows = pages[page] || [];

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ width: 48 }}>
          <IconButton size="small" onClick={handleToggle}>
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
              {histLoading ? (
                <CircularProgress size={20} sx={{ m: 1 }} />
              ) : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Price</TableCell>
                        <TableCell>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pageRows.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.price}</TableCell>
                          <TableCell>{r.time}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <IconButton size="small" onClick={handlePrev} disabled={page === 0}>
                      <KeyboardArrowUpIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption">Page {page + 1}</Typography>
                    <IconButton size="small" onClick={handleNext} disabled={!hasMore && pages[page + 1] === undefined}>
                      <KeyboardArrowDownIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// Extract ET hours/minutes from a UTC timestamp correctly, regardless of user's local tz
const etMins = (dateStr) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(new Date(dateStr));
  const h = parseInt(parts.find(p => p.type === 'hour').value);
  const m = parseInt(parts.find(p => p.type === 'minute').value);
  return h * 60 + m;
};

const etDateStr = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD

function MarketChart({ symbols, news }) {
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [dayOffset, setDayOffset] = useState(0);
  const [hoveredNews, setHoveredNews] = useState(null);
  const chartContainerRef = useRef(null);
  const [selectedSignal, setSelectedSignal] = useState(null); // null | 'ma_crossover'
  const [maSignal, setMaSignal] = useState(null);

  const dayLabel = (offset) => {
    if (offset === 0) return 'Today';
    if (offset === 1) return 'Yesterday';
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  };

  const getETDateParam = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  };

  useEffect(() => {
    if (!selectedSymbol || selectedSignal !== 'ma_crossover') {
      setMaSignal(null);
      return;
    }
    fetch(`${API}/signals/ma-crossover/${selectedSymbol}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setMaSignal(data))
      .catch(() => setMaSignal(null));
  }, [selectedSymbol, selectedSignal]);

  useEffect(() => {
    if (!selectedSymbol) return;
    setChartLoading(true);
    const date = getETDateParam(dayOffset);
    fetch(`${API}/prices/${selectedSymbol}?date=${date}&limit=500`)
      .then(res => res.json())
      .then(rows => {
        const mapped = rows
          .map(r => ({ date: etDateStr(r.created_at), mins: etMins(r.created_at), price: parseFloat(r.price) }))
          .filter(r => r.date === date && r.mins >= 570 && r.mins <= 960)
          .reverse();
        setChartData(mapped);
      })
      .finally(() => setChartLoading(false));
  }, [selectedSymbol, dayOffset]);

  const newsPoints = useMemo(() => {
    if (!selectedSymbol || !chartData.length) return [];
    const targetDate = getETDateParam(dayOffset);
    return news
      .filter(n => {
        if (!n._published_at || !n._tags.includes(selectedSymbol)) return false;
        if (etDateStr(n._published_at) !== targetDate) return false;
        const mins = etMins(n._published_at);
        return mins >= 570 && mins <= 960;
      })
      .map(n => {
        const mins = etMins(n._published_at);
        const nearest = chartData.reduce((a, b) =>
          Math.abs(a.mins - mins) <= Math.abs(b.mins - mins) ? a : b
        );
        const h = Math.floor(mins / 60); const m = String(mins % 60).padStart(2, '0');
        const h12 = h > 12 ? h - 12 : h; const suffix = h >= 12 ? 'PM' : 'AM';
        return { mins, price: nearest.price, summary: n.summary, title: n._title, timeLabel: `${h12}:${m} ${suffix} ET` };
      });
  }, [news, selectedSymbol, chartData, dayOffset]);

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6">Price Chart</Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Symbol</InputLabel>
          <Select value={selectedSymbol} label="Symbol" onChange={e => setSelectedSymbol(e.target.value)}>
            {symbols.map(s => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
          </Select>
        </FormControl>
        <Chip
          label="MA Crossover"
          size="small"
          onClick={() => setSelectedSignal(s => s === 'ma_crossover' ? null : 'ma_crossover')}
          sx={{
            bgcolor: selectedSignal === 'ma_crossover' ? '#6366f1' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontWeight: selectedSignal === 'ma_crossover' ? 700 : 400,
            cursor: 'pointer',
            '&:hover': { bgcolor: selectedSignal === 'ma_crossover' ? '#4f46e5' : 'rgba(255,255,255,0.18)' },
          }}
        />
        {maSignal && (
          <Chip
            size="small"
            label={maSignal.golden_cross_active ? '▲ Golden Cross' : '▼ Death Cross'}
            sx={{
              bgcolor: maSignal.golden_cross_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: maSignal.golden_cross_active ? '#22c55e' : '#ef4444',
              border: `1px solid ${maSignal.golden_cross_active ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
              fontWeight: 600,
            }}
          />
        )}
        {maSignal && maSignal.days_since_cross != null && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
            {maSignal.days_since_cross}d ago
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
          <IconButton size="small" onClick={() => setDayOffset(o => o + 1)}>
            <KeyboardArrowLeftIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>
            {dayLabel(dayOffset)}
          </Typography>
          <IconButton size="small" onClick={() => setDayOffset(o => o - 1)} disabled={dayOffset === 0}>
            <KeyboardArrowRightIcon fontSize="small" />
          </IconButton>
        </Box>
        {chartLoading && <CircularProgress size={20} />}
      </Box>
      {chartData.length > 0 ? (
        <Box sx={{ position: 'relative' }} ref={chartContainerRef}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="mins" type="number" domain={[570, 960]}
                ticks={[570, 600, 660, 720, 780, 840, 900, 960]}
                tickFormatter={m => { const h = Math.floor(m / 60); const min = String(m % 60).padStart(2, '0'); return h > 12 ? `${h - 12}:${min}` : `${h}:${min}`; }}
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }}
              />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }} />
              <Tooltip
                formatter={val => [`$${val.toFixed(2)}`, 'Price']}
                labelFormatter={m => { const h = Math.floor(m / 60); const min = String(m % 60).padStart(2, '0'); const suffix = h >= 12 ? 'PM' : 'AM'; const h12 = h > 12 ? h - 12 : h; return `${h12}:${min} ${suffix} ET`; }}
                contentStyle={{ fontSize: 12, background: 'rgba(10,14,28,0.95)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
              <Area type="monotone" dataKey="price" stroke="#60a5fa" strokeWidth={2} fill="url(#priceGradient)" dot={false} />
              {maSignal && selectedSignal === 'ma_crossover' && (<>
                <ReferenceLine y={maSignal.sma_50} stroke="#818cf8" strokeDasharray="5 3" strokeWidth={1.5}
                  label={{ value: `SMA 50  $${maSignal.sma_50.toFixed(2)}`, position: 'insideTopRight', fontSize: 10, fill: '#818cf8' }} />
                <ReferenceLine y={maSignal.sma_200} stroke="#fb923c" strokeDasharray="5 3" strokeWidth={1.5}
                  label={{ value: `SMA 200  $${maSignal.sma_200.toFixed(2)}`, position: 'insideBottomRight', fontSize: 10, fill: '#fb923c' }} />
              </>)}
              {newsPoints.map((n, i) => (
                <ReferenceDot key={i} x={n.mins} y={n.price}
                  shape={({ cx, cy }) => (
                    <circle cx={cx} cy={cy} r={6}
                      fill="#f59e0b" stroke="rgba(255,255,255,0.9)" strokeWidth={1.5}
                      style={{ cursor: 'pointer', filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.6))' }}
                      onMouseEnter={() => setHoveredNews({ cx, cy, ...n })}
                      onMouseLeave={() => setHoveredNews(null)}
                    />
                  )}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          {hoveredNews && (
            <Box sx={{
              position: 'absolute',
              left: hoveredNews.cx,
              top: hoveredNews.cy,
              transform: 'translate(-50%, calc(-100% - 12px))',
              maxWidth: 280,
              p: 1.5,
              borderRadius: 1,
              background: 'rgba(10,14,28,0.97)',
              border: '1px solid rgba(245,158,11,0.4)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              zIndex: 10,
            }}>
              <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, display: 'block', mb: 0.5 }}>
                {hoveredNews.timeLabel}
              </Typography>
              {hoveredNews.title && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  {hoveredNews.title}
                </Typography>
              )}
              {hoveredNews.summary && hoveredNews.summary !== '—' && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', lineHeight: 1.4 }}>
                  {hoveredNews.summary}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {selectedSymbol ? 'No data' : 'Select a symbol to view chart'}
          </Typography>
        </Box>
      )}
    </Paper>
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
  const [newsFilter, setNewsFilter] = useState(new Set());
  const [enrichedOnly, setEnrichedOnly] = useState(true);

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
        _tags: (row.tags || []).map(t => t.toUpperCase()),
        _enriched_status: row.enrichment_status || null,
        _published_at: row.published_at || null,
        _title: row.title || null,
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
                    <SymbolRow key={symbol} symbol={symbol} latest={records[0]} />
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

        {/* Price Chart — full width */}
        <Grid size={12}>
          <MarketChart symbols={symbols.map(s => s.symbol)} news={news} />
        </Grid>

        {/* News Articles — full width */}
        <Grid size={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ mr: 1 }}>News</Typography>
              <Chip
                label="Enriched"
                size="small"
                onClick={() => setEnrichedOnly(v => !v)}
                sx={{
                  bgcolor: enrichedOnly ? '#22c55e' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontWeight: enrichedOnly ? 700 : 400,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: enrichedOnly ? '#16a34a' : 'rgba(255,255,255,0.18)' },
                }}
              />
              <Box sx={{ width: '1px', height: 20, bgcolor: 'rgba(255,255,255,0.15)', mx: 0.5 }} />
              <Chip
                label="All"
                size="small"
                onClick={() => setNewsFilter(new Set())}
                sx={{
                  bgcolor: newsFilter.size === 0 ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontWeight: newsFilter.size === 0 ? 700 : 400,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: newsFilter.size === 0 ? '#3b82f6' : 'rgba(255,255,255,0.18)' },
                }}
              />
              {symbols.map(s => {
                const active = newsFilter.has(s.symbol);
                return (
                  <Chip
                    key={s.symbol}
                    label={s.symbol}
                    size="small"
                    onClick={() => setNewsFilter(prev => {
                      const next = new Set(prev);
                      if (active) next.delete(s.symbol); else next.add(s.symbol);
                      return next;
                    })}
                    sx={{
                      bgcolor: active ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontWeight: active ? 700 : 400,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: active ? '#3b82f6' : 'rgba(255,255,255,0.18)' },
                    }}
                  />
                );
              })}
            </Box>
            <DataGrid
              rows={news.filter(r =>
                (!enrichedOnly || r._enriched_status === 'enriched') &&
                (newsFilter.size === 0 || r._tags.some(t => newsFilter.has(t)))
              )}
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
    </ThemeProvider>
  );
}