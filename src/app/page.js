'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import { keyframes } from '@mui/system';
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
  LinearProgress,
  Divider,
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
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
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
  const [selectedSignal, setSelectedSignal] = useState(null); // null | 'ma_crossover' | 'rsi_divergence'
  const [maSignal, setMaSignal] = useState(null);
  const [maLoading, setMaLoading] = useState(false);
  const maPollingRef = useRef(null);
  const [rsiDivSignal, setRsiDivSignal] = useState(null);
  const [rsiDivLoading, setRsiDivLoading] = useState(false);
  const rsiDivPollingRef = useRef(null);

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
    if (maPollingRef.current) { clearInterval(maPollingRef.current); maPollingRef.current = null; }

    if (!selectedSymbol || selectedSignal !== 'ma_crossover') {
      setMaSignal(null);
      setMaLoading(false);
      return;
    }

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

    const startPolling = () => {
      maPollingRef.current = setInterval(() => {
        fetch(`${API}/signals/ma-crossover/${selectedSymbol}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.computed_date === today) {
              setMaSignal(data);
              setMaLoading(false);
              clearInterval(maPollingRef.current);
              maPollingRef.current = null;
            }
          })
          .catch(() => {});
      }, 3000);
      // Give up after 45s
      setTimeout(() => {
        if (maPollingRef.current) { clearInterval(maPollingRef.current); maPollingRef.current = null; setMaLoading(false); }
      }, 45000);
    };

    setMaLoading(true);
    fetch(`${API}/signals/ma-crossover/${selectedSymbol}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.computed_date === today) {
          setMaSignal(data);
          setMaLoading(false);
        } else {
          if (data) setMaSignal(data); // show stale while refreshing
          fetch(`${API}/signals/ma-crossover/${selectedSymbol}/refresh`, { method: 'POST' }).catch(() => {});
          startPolling();
        }
      })
      .catch(() => { setMaSignal(null); setMaLoading(false); });

    return () => { if (maPollingRef.current) { clearInterval(maPollingRef.current); maPollingRef.current = null; } };
  }, [selectedSymbol, selectedSignal]);

  useEffect(() => {
    if (rsiDivPollingRef.current) { clearInterval(rsiDivPollingRef.current); rsiDivPollingRef.current = null; }

    if (!selectedSymbol || selectedSignal !== 'rsi_divergence') {
      setRsiDivSignal(null);
      setRsiDivLoading(false);
      return;
    }

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

    const startPolling = () => {
      rsiDivPollingRef.current = setInterval(() => {
        fetch(`${API}/signals/rsi-divergence?symbol=${selectedSymbol}&limit=1`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.length > 0) {
              const row = data[0];
              if (row.computed_at && row.computed_at.startsWith(today)) {
                setRsiDivSignal(row);
                setRsiDivLoading(false);
                clearInterval(rsiDivPollingRef.current);
                rsiDivPollingRef.current = null;
              }
            }
          })
          .catch(() => {});
      }, 3000);
      setTimeout(() => {
        if (rsiDivPollingRef.current) { clearInterval(rsiDivPollingRef.current); rsiDivPollingRef.current = null; setRsiDivLoading(false); }
      }, 45000);
    };

    setRsiDivLoading(true);
    fetch(`${API}/signals/rsi-divergence?symbol=${selectedSymbol}&limit=1`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.length > 0) {
          const row = data[0];
          setRsiDivSignal(row);
          if (row.computed_at && row.computed_at.startsWith(today)) {
            setRsiDivLoading(false);
          } else {
            fetch(`${API}/signals/rsi-divergence/trigger`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ symbol: selectedSymbol, timeframe: '1d' }),
            }).catch(() => {});
            startPolling();
          }
        } else {
          fetch(`${API}/signals/rsi-divergence/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: selectedSymbol, timeframe: '1d' }),
          }).catch(() => {});
          startPolling();
        }
      })
      .catch(() => { setRsiDivSignal(null); setRsiDivLoading(false); });

    return () => { if (rsiDivPollingRef.current) { clearInterval(rsiDivPollingRef.current); rsiDivPollingRef.current = null; } };
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
        {maSignal && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', display: 'flex', gap: 1.5 }}>
            <span>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Trend </span>
              {maSignal.days_since_cross != null ? `${maSignal.days_since_cross}d` : 'N/A'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Spread </span>
              {maSignal.ma_spread_pct != null ? `${parseFloat(maSignal.ma_spread_pct).toFixed(2)}%` : 'N/A'}
            </span>
          </Typography>
        )}
        {maLoading && <CircularProgress size={16} sx={{ color: '#818cf8' }} />}
        <Chip
          label="RSI Div"
          size="small"
          onClick={() => setSelectedSignal(s => s === 'rsi_divergence' ? null : 'rsi_divergence')}
          sx={{
            bgcolor: selectedSignal === 'rsi_divergence' ? '#0ea5e9' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontWeight: selectedSignal === 'rsi_divergence' ? 700 : 400,
            cursor: 'pointer',
            '&:hover': { bgcolor: selectedSignal === 'rsi_divergence' ? '#0284c7' : 'rgba(255,255,255,0.18)' },
          }}
        />
        {rsiDivSignal && (() => {
          const divMap = {
            bullish:       { icon: '▲', label: 'Bullish',     bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  color: '#22c55e' },
            bearish:       { icon: '▼', label: 'Bearish',     bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  color: '#ef4444' },
            hidden_bullish:{ icon: '▲', label: 'Hidden Bull', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#f59e0b' },
            hidden_bearish:{ icon: '▼', label: 'Hidden Bear', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#f59e0b' },
          };
          const m = divMap[rsiDivSignal.divergence_type];
          if (!m) return (
            <Chip size="small" label="No Divergence"
              sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.15)' }} />
          );
          return (
            <Chip size="small"
              label={`${m.icon} ${m.label}${rsiDivSignal.confidence ? ` · ${rsiDivSignal.confidence}` : ''}`}
              sx={{ bgcolor: m.bg, color: m.color, border: `1px solid ${m.border}`, fontWeight: 600 }} />
          );
        })()}
        {rsiDivLoading && <CircularProgress size={16} sx={{ color: '#0ea5e9' }} />}
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

function ScoreGauge({ score, size = 114 }) {
  const sw = 9;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(1, score)) * circ;
  const color = score >= 0.65 ? '#22c55e' : score >= 0.4 ? '#f59e0b' : '#ef4444';
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={sw}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ color, fontWeight: 800, fontSize: '1.7rem', lineHeight: 1, letterSpacing: '-0.02em' }}>
          {Math.round(score * 100)}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', mt: 0.25 }}>
          Score
        </Typography>
      </Box>
    </Box>
  );
}

function MiniScoreRing({ score, size = 38 }) {
  const sw = 3.5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(1, score)) * circ;
  const color = score >= 0.65 ? '#22c55e' : score >= 0.4 ? '#f59e0b' : '#ef4444';
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={sw}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round" />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ color, fontSize: '0.6rem', fontWeight: 700, lineHeight: 1 }}>
          {Math.round(score * 100)}
        </Typography>
      </Box>
    </Box>
  );
}

const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

function AnalysisReport({ report }) {
  const dec = (report.decision || '').toUpperCase();
  const score = parseFloat(report.score) || 0;
  const scoreColor = score >= 0.65 ? '#22c55e' : score >= 0.4 ? '#f59e0b' : '#ef4444';
  const decConfig = {
    BUY:  { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  color: '#22c55e', glow: 'rgba(34,197,94,0.3)' },
    SELL: { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
    HOLD: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  };
  const dc = decConfig[dec] || decConfig.HOLD;
  const posColors = { large: '#22c55e', medium: '#60a5fa', small: '#f59e0b', none: 'rgba(255,255,255,0.3)' };

  const maSignalColor = (type) => {
    if (!type) return 'rgba(255,255,255,0.5)';
    const t = type.toLowerCase();
    if (t.includes('golden') || t.includes('bull')) return '#22c55e';
    if (t.includes('death') || t.includes('bear')) return '#ef4444';
    return '#818cf8';
  };

  const rsiColor = (type) => {
    if (!type) return 'rgba(255,255,255,0.5)';
    const t = type.toLowerCase();
    if (t.includes('bullish')) return '#22c55e';
    if (t.includes('bearish')) return '#ef4444';
    return '#0ea5e9';
  };

  const maScore = (() => {
    const t = (report.ma_signal_type || '').toLowerCase();
    if (t.includes('golden')) return 88;
    if (t.includes('death')) return 12;
    return 50;
  })();
  const rsiScore = (() => {
    const t = (report.rsi_divergence_type || '').toLowerCase();
    if (t === 'bullish') return 88;
    if (t === 'hidden_bullish') return 70;
    if (t === 'hidden_bearish') return 30;
    if (t === 'bearish') return 12;
    return 50;
  })();
  const newsScore = report.news_veto ? 18 : (report.news_summary ? 78 : 52);
  const radarData = [
    { axis: 'MA Signal', val: maScore },
    { axis: 'RSI Div', val: rsiScore },
    { axis: 'News', val: newsScore },
    { axis: 'Conviction', val: Math.round(score * 100) },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 3, mb: 2.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Score ring + decision */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, minWidth: 114 }}>
          <ScoreGauge score={score} />
          <Box sx={{
            px: 2.5, py: 0.75, borderRadius: 1.5,
            bgcolor: dc.bg, border: `1px solid ${dc.border}`,
            boxShadow: `0 0 20px ${dc.glow}`,
          }}>
            <Typography sx={{ color: dc.color, fontWeight: 800, fontSize: '1.3rem', letterSpacing: '0.12em', lineHeight: 1 }}>
              {dec}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.22)' }}>
            {timeAgo(report.generated_at)}
          </Typography>
        </Box>

        {/* Radar chart */}
        <Box sx={{ flex: 1, minWidth: 180, height: 185 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="axis"
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.45)', fontWeight: 600 }} />
              <Radar dataKey="val" stroke={scoreColor} fill={scoreColor} fillOpacity={0.18}
                strokeWidth={2} dot={{ fill: scoreColor, r: 3, strokeWidth: 0 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Box>

        {/* Meta */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 130 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {report.signal_agreement && (
              <Chip size="small" label="✓ Signals Agree"
                sx={{ height: 22, fontSize: '0.68rem', bgcolor: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', width: 'fit-content' }} />
            )}
            {report.news_veto && (
              <Chip size="small" label="⚑ News Veto"
                sx={{ height: 22, fontSize: '0.68rem', bgcolor: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', width: 'fit-content' }} />
            )}
          </Box>
          {report.price_at_analysis && (
            <Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.25)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.58rem' }}>Price</Typography>
              <Typography sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontSize: '1rem' }}>
                ${parseFloat(report.price_at_analysis).toFixed(2)}
              </Typography>
            </Box>
          )}
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.25)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.58rem' }}>Position</Typography>
            <Typography sx={{ fontWeight: 700, color: posColors[(report.position_size || 'none').toLowerCase()] || '#fff', fontSize: '0.9rem' }}>
              {(report.position_size || 'none').toUpperCase()}
            </Typography>
          </Box>
          {report.symbol && (
            <Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.25)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.58rem' }}>Symbol</Typography>
              <Typography sx={{ fontWeight: 700, color: '#818cf8', fontSize: '0.9rem' }}>{report.symbol}</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Signal cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={4}>
          <Box sx={{
            p: 1.75, height: '100%', borderRadius: 1.5,
            bgcolor: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.18)',
            borderLeft: '3px solid #818cf8',
          }}>
            <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', mb: 0.75, fontSize: '0.6rem' }}>
              MA Crossover
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: maSignalColor(report.ma_signal_type), mb: 0.5, fontSize: '0.85rem' }}>
              {report.ma_signal_type || '—'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {report.ma_trend_strength && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>{report.ma_trend_strength}</Typography>
              )}
              {report.ma_confidence && (
                <Chip size="small" label={report.ma_confidence}
                  sx={{ height: 16, fontSize: '0.62rem', bgcolor: 'rgba(129,140,248,0.15)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.25)' }} />
              )}
            </Box>
          </Box>
        </Grid>
        <Grid size={4}>
          <Box sx={{
            p: 1.75, height: '100%', borderRadius: 1.5,
            bgcolor: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.18)',
            borderLeft: '3px solid #0ea5e9',
          }}>
            <Typography variant="caption" sx={{ color: '#0ea5e9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', mb: 0.75, fontSize: '0.6rem' }}>
              RSI Divergence
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: rsiColor(report.rsi_divergence_type), mb: 0.5, fontSize: '0.85rem' }}>
              {report.rsi_divergence_type || '—'}
            </Typography>
            {report.rsi_trend_strength && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', fontSize: '0.7rem' }}>{report.rsi_trend_strength}</Typography>
            )}
          </Box>
        </Grid>
        <Grid size={4}>
          <Box sx={{
            p: 1.75, height: '100%', borderRadius: 1.5,
            bgcolor: report.news_veto ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
            border: `1px solid ${report.news_veto ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)'}`,
            borderLeft: `3px solid ${report.news_veto ? '#ef4444' : '#f59e0b'}`,
          }}>
            <Typography variant="caption" sx={{ color: report.news_veto ? '#ef4444' : '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', mb: 0.75, fontSize: '0.6rem' }}>
              News{report.news_veto ? ' · Veto' : ''}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.73rem', lineHeight: 1.5 }}>
              {report.news_summary
                ? report.news_summary.slice(0, 110) + (report.news_summary.length > 110 ? '…' : '')
                : '—'}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {report.reasoning && (
        <Box sx={{ p: 1.75, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 0.75, fontSize: '0.6rem' }}>
            Reasoning
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)', lineHeight: 1.7, fontSize: '0.8rem' }}>
            {report.reasoning}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function HistoryRow({ report, onSelect }) {
  const [open, setOpen] = useState(false);
  const dec = (report.decision || '').toUpperCase();
  const score = parseFloat(report.score) || 0;
  const decConfig = {
    BUY:  { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  color: '#22c55e' },
    SELL: { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: '#ef4444' },
    HOLD: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b' },
  };
  const dc = decConfig[dec] || decConfig.HOLD;
  const posColors = { large: '#22c55e', medium: '#60a5fa', small: '#f59e0b', none: 'rgba(255,255,255,0.3)' };

  return (
    <Box sx={{ borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', transition: 'border-color 0.15s', '&:hover': { borderColor: 'rgba(255,255,255,0.14)' } }}>
      <Box
        onClick={() => { setOpen(o => !o); onSelect && onSelect(report); }}
        sx={{
          display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1,
          cursor: 'pointer',
          bgcolor: open ? 'rgba(255,255,255,0.04)' : 'transparent',
          transition: 'background 0.15s',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
        }}
      >
        <MiniScoreRing score={score} />

        <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 700, fontSize: '0.72rem', minWidth: 44 }}>
          {report.symbol}
        </Typography>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', minWidth: 140, fontSize: '0.7rem' }}>
          {new Date(report.generated_at).toLocaleString()}
        </Typography>

        <Box sx={{ px: 1.25, py: 0.2, borderRadius: 0.75, bgcolor: dc.bg, border: `1px solid ${dc.border}`, minWidth: 44, textAlign: 'center' }}>
          <Typography sx={{ color: dc.color, fontWeight: 700, fontSize: '0.68rem', lineHeight: 1.6 }}>{dec}</Typography>
        </Box>

        <Typography variant="caption" sx={{
          color: posColors[(report.position_size || 'none').toLowerCase()] || '#fff',
          fontWeight: 600, minWidth: 48, fontSize: '0.7rem',
        }}>
          {(report.position_size || 'none').toUpperCase()}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', alignItems: 'center' }}>
          {report.signal_agreement && (
            <Chip size="small" label="✓" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', minWidth: 26 }} />
          )}
          {report.news_veto && (
            <Chip size="small" label="⚑" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', minWidth: 26 }} />
          )}
          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.25)', p: 0.25 }}>
            {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={open}>
        <Box sx={{ px: 2, py: 1.75, bgcolor: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Grid container spacing={1.5} sx={{ mb: report.reasoning ? 1.5 : 0 }}>
            <Grid size={4}>
              <Typography variant="caption" sx={{ color: '#818cf8', display: 'block', mb: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem' }}>MA Crossover</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{report.ma_signal_type || '—'}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.68rem' }}>
                {[report.ma_trend_strength, report.ma_confidence].filter(Boolean).join(' · ') || '—'}
              </Typography>
            </Grid>
            <Grid size={4}>
              <Typography variant="caption" sx={{ color: '#0ea5e9', display: 'block', mb: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem' }}>RSI Divergence</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{report.rsi_divergence_type || '—'}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.68rem' }}>{report.rsi_trend_strength || '—'}</Typography>
            </Grid>
            <Grid size={4}>
              <Typography variant="caption" sx={{ color: report.news_veto ? '#ef4444' : '#f59e0b', display: 'block', mb: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem' }}>
                News{report.news_veto ? ' · Veto' : ''}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>
                {report.news_summary ? report.news_summary.slice(0, 110) + (report.news_summary.length > 110 ? '…' : '') : '—'}
              </Typography>
            </Grid>
          </Grid>
          {report.reasoning && (
            <Typography variant="body2" sx={{
              color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', lineHeight: 1.65,
              borderTop: '1px solid rgba(255,255,255,0.06)', pt: 1.25,
            }}>
              {report.reasoning}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
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

const orbit = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const pulseCore = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5), 0 0 16px rgba(99,102,241,0.25); }
  50%       { box-shadow: 0 0 0 12px rgba(99,102,241,0), 0 0 32px rgba(99,102,241,0.5); }
`;

const expandRing = keyframes`
  0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0.65; }
  100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
`;

const stageAnim = keyframes`
  0%   { opacity: 0; transform: translateY(7px); }
  12%  { opacity: 1; transform: translateY(0); }
  80%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-5px); }
`;

const reportFadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

function AnalysisLoader({ symbol }) {
  const [stageIdx, setStageIdx] = useState(0);
  const stages = [
    'Fetching MA crossover signals',
    'Analyzing RSI divergence',
    'Scanning latest news',
    'Weighing signal confidence',
    'Computing conviction score',
    'Finalizing decision',
  ];

  useEffect(() => {
    const t = setInterval(() => setStageIdx(i => (i + 1) % stages.length), 3500);
    return () => clearInterval(t);
  }, []);

  const dots = [
    { radius: 54, size: 8, color: '#818cf8', shadow: '0 0 10px rgba(129,140,248,0.9), 0 0 20px rgba(129,140,248,0.4)', period: '2.8s', delay: '0s' },
    { radius: 74, size: 7, color: '#0ea5e9', shadow: '0 0 10px rgba(14,165,233,0.9), 0 0 20px rgba(14,165,233,0.4)',   period: '4.2s', delay: '-1.4s' },
    { radius: 92, size: 6, color: '#22c55e', shadow: '0 0 8px rgba(34,197,94,0.9),  0 0 16px rgba(34,197,94,0.4)',    period: '6s',   delay: '-4s' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3.5, py: 3, flex: 1 }}>
      <Box sx={{ position: 'relative', width: 220, height: 220, flexShrink: 0 }}>
        {/* Expanding radar rings */}
        {[0, 1, 2].map(i => (
          <Box key={i} sx={{
            position: 'absolute', top: '50%', left: '50%',
            width: 56, height: 56, borderRadius: '50%',
            border: '1.5px solid rgba(99,102,241,0.55)',
            animation: `${expandRing} 2.4s ease-out ${i * 0.8}s infinite`,
          }} />
        ))}
        {/* Faint orbit guide circles */}
        {dots.map((d, i) => (
          <Box key={i} sx={{
            position: 'absolute', top: '50%', left: '50%',
            width: d.radius * 2, height: d.radius * 2,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '1px dashed rgba(255,255,255,0.05)',
          }} />
        ))}
        {/* Orbiting dots */}
        {dots.map((d, i) => (
          <Box key={i} sx={{
            position: 'absolute', top: '50%', left: '50%',
            width: 0, height: 0,
            animation: `${orbit} ${d.period} linear infinite`,
            animationDelay: d.delay,
          }}>
            <Box sx={{
              position: 'absolute',
              top: -(d.size / 2),
              left: d.radius - d.size / 2,
              width: d.size, height: d.size,
              borderRadius: '50%',
              background: d.color,
              boxShadow: d.shadow,
            }} />
          </Box>
        ))}
        {/* Core orb */}
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          width: 50, height: 50,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(149,160,255,0.95), rgba(14,165,233,0.7) 60%, rgba(99,102,241,0.5))',
          border: '1px solid rgba(255,255,255,0.22)',
          animation: `${pulseCore} 2s ease-in-out infinite`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.06em', textShadow: '0 0 10px rgba(255,255,255,0.6)' }}>
            AI
          </Typography>
        </Box>
      </Box>

      <Box sx={{ textAlign: 'center', minWidth: 260 }}>
        <Typography sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.88)', mb: 1, fontSize: '1rem', letterSpacing: '0.01em' }}>
          Analyzing {symbol}
        </Typography>
        <Box sx={{ height: 26, position: 'relative', overflow: 'hidden' }}>
          <Box key={stageIdx} sx={{ animation: `${stageAnim} 3.5s ease-in-out forwards` }}>
            <Typography sx={{ color: '#818cf8', fontWeight: 600, fontSize: '0.82rem', letterSpacing: '0.02em' }}>
              {stages[stageIdx]}…
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="indeterminate"
          sx={{
            mt: 1.5, borderRadius: 4,
            bgcolor: 'rgba(99,102,241,0.1)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 50%, #22c55e 100%)',
              borderRadius: 4,
            },
          }}
        />
        <Typography sx={{ color: 'rgba(255,255,255,0.2)', mt: 1.25, display: 'block', fontSize: '0.7rem' }}>
          Usually takes 1–3 minutes
        </Typography>
      </Box>
    </Box>
  );
}

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
  const [analysisSymbol, setAnalysisSymbol] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisWaiting, setAnalysisWaiting] = useState(false);
  const analysisPollingRef = useRef(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historySymbolFilter, setHistorySymbolFilter] = useState('');

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

  const fetchAnalysisHistory = (page = 0, symbolFilter = '') => {
    setHistoryLoading(true);
    const params = `limit=10&offset=${page * 10}${symbolFilter ? `&symbol=${symbolFilter}` : ''}`;
    fetch(`${API}/analysis/reports?${params}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const rows = Array.isArray(data) ? data : [];
        setAnalysisHistory(rows);
        setHistoryHasMore(rows.length === 10);
      })
      .catch(() => setAnalysisHistory([]))
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => { fetchAnalysisHistory(historyPage, historySymbolFilter); }, [historyPage, historySymbolFilter]);

  useEffect(() => {
    if (!analysisSymbol || analysisWaiting) return;
    fetch(`${API}/analysis/latest/${analysisSymbol}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setAnalysisResult(data || null))
      .catch(() => {});
  }, [analysisSymbol]);

  const startAnalysisPolling = (symbol, requestTime) => {
    if (analysisPollingRef.current) clearInterval(analysisPollingRef.current);
    const check = () => {
      fetch(`${API}/analysis/latest/${symbol}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.generated_at >= requestTime) {
            setAnalysisResult(data);
            setAnalysisWaiting(false);
            clearInterval(analysisPollingRef.current);
            analysisPollingRef.current = null;
            fetchAnalysisHistory(0);
            setHistoryPage(0);
            setSnackbar({ open: true, message: `Analysis finished for ${symbol}`, severity: 'success' });
          }
        })
        .catch(() => {});
    };
    check();
    analysisPollingRef.current = setInterval(check, 4000);
    setTimeout(() => {
      if (analysisPollingRef.current) {
        clearInterval(analysisPollingRef.current);
        analysisPollingRef.current = null;
        setAnalysisWaiting(false);
      }
    }, 120000);
  };

  const handleRequestAnalysis = async () => {
    if (!analysisSymbol) return;
    setAnalysisLoading(true);
    try {
      const requestTime = new Date().toISOString();
      const res = await fetch(`${API}/analysis/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: analysisSymbol }),
      });
      if (!res.ok) {
        setSnackbar({ open: true, message: 'Failed to queue analysis', severity: 'error' });
      } else {
        const data = await res.json();
        setSnackbar({ open: true, message: data.message || `Analysis queued for ${analysisSymbol}`, severity: 'success' });
        setAnalysisResult(null);
        setAnalysisWaiting(true);
        startAnalysisPolling(analysisSymbol, requestTime);
      }
    } catch {
      setSnackbar({ open: true, message: 'Network error', severity: 'error' });
    } finally {
      setAnalysisLoading(false);
    }
  };

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

        {/* Analysis — full width */}
        <Grid size={12}>
          <Paper sx={{ p: 0, overflow: 'hidden' }}>
            <Grid container sx={{ minHeight: 280 }}>

              {/* Left: request panel */}
              <Grid size={3} sx={{
                p: 3,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: 'linear-gradient(160deg, rgba(99,102,241,0.13) 0%, rgba(14,165,233,0.06) 100%)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="overline" sx={{ color: '#818cf8', letterSpacing: '0.12em', fontWeight: 700, fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                      AI Analysis
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
                      Run Signal<br />Analysis
                    </Typography>
                  </Box>

                  <FormControl size="small" fullWidth>
                    <InputLabel>Symbol</InputLabel>
                    <Select
                      value={analysisSymbol}
                      label="Symbol"
                      onChange={e => setAnalysisSymbol(e.target.value)}
                    >
                      {symbols.map(s => (
                        <MenuItem key={s.symbol} value={s.symbol}>{s.symbol}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleRequestAnalysis}
                    disabled={analysisLoading || !analysisSymbol || analysisWaiting}
                    sx={{
                      background: (analysisWaiting || analysisLoading)
                        ? 'rgba(99,102,241,0.18)'
                        : 'linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      py: 1.25,
                      borderRadius: 1.5,
                      fontSize: '0.95rem',
                      letterSpacing: '0.06em',
                      boxShadow: (analysisWaiting || analysisLoading) ? 'none' : '0 4px 22px rgba(99,102,241,0.45)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
                        boxShadow: '0 6px 30px rgba(99,102,241,0.6)',
                      },
                      '&.Mui-disabled': { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' },
                    }}
                  >
                    {analysisLoading
                      ? <CircularProgress size={20} color="inherit" />
                      : analysisWaiting ? 'Analyzing…' : 'Analyze'}
                  </Button>
                </Box>

                {analysisResult && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.22)' }}>
                    {analysisResult.symbol} · {timeAgo(analysisResult.generated_at)}
                  </Typography>
                )}
              </Grid>

              {/* Right: result / empty / waiting */}
              <Grid size={9} sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {analysisWaiting ? (
                  <AnalysisLoader symbol={analysisSymbol} />
                ) : analysisResult ? (
                  <Box key={analysisResult.id} sx={{ animation: `${reportFadeIn} 0.5s ease-out` }}>
                    <AnalysisReport report={analysisResult} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, flex: 1 }}>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.14)', fontWeight: 600, letterSpacing: '0.04em' }}>
                      No analysis yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.1)', textAlign: 'center', maxWidth: 340, lineHeight: 1.85 }}>
                      Select a tracked symbol and click Analyze to receive AI‑powered signal scoring,
                      a BUY / SELL / HOLD decision, and full reasoning from N8N.
                    </Typography>
                  </Box>
                )}
              </Grid>

            </Grid>
          </Paper>
        </Grid>

        {/* Analysis History */}
        <Grid size={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Typography variant="h6">Analysis History</Typography>
              {historyLoading && <CircularProgress size={14} sx={{ color: '#60a5fa' }} />}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                <IconButton size="small" onClick={() => setHistoryPage(p => p - 1)} disabled={historyPage === 0 || historyLoading}>
                  <KeyboardArrowLeftIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', minWidth: 48, textAlign: 'center' }}>
                  Page {historyPage + 1}
                </Typography>
                <IconButton size="small" onClick={() => setHistoryPage(p => p + 1)} disabled={!historyHasMore || historyLoading}>
                  <KeyboardArrowRightIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
              <Chip
                label="All"
                size="small"
                onClick={() => { setHistorySymbolFilter(''); setHistoryPage(0); }}
                sx={{
                  bgcolor: historySymbolFilter === '' ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontWeight: historySymbolFilter === '' ? 700 : 400,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: historySymbolFilter === '' ? '#3b82f6' : 'rgba(255,255,255,0.18)' },
                }}
              />
              {symbols.map(s => {
                const active = historySymbolFilter === s.symbol;
                return (
                  <Chip
                    key={s.symbol}
                    label={s.symbol}
                    size="small"
                    onClick={() => { setHistorySymbolFilter(active ? '' : s.symbol); setHistoryPage(0); }}
                    sx={{
                      bgcolor: active ? '#818cf8' : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontWeight: active ? 700 : 400,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: active ? '#6366f1' : 'rgba(255,255,255,0.18)' },
                    }}
                  />
                );
              })}
            </Box>

            {!historyLoading && analysisHistory.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.25)', py: 3, textAlign: 'center' }}>
                No analysis reports yet
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {analysisHistory.map(r => <HistoryRow key={r.id} report={r} onSelect={r => { setAnalysisResult(r); setAnalysisSymbol(r.symbol); }} />)}
              </Box>
            )}
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