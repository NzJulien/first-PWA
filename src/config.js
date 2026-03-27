// ═══════════════════════════════════════════════════
//  AuraSense — config.js
//  Replace the placeholder values below with your own
// ═══════════════════════════════════════════════════

const SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';

// Your FastAPI backend (run: uvicorn app.main:app --reload)
const API_BASE = 'http://127.0.0.1:8000';

// ── Supabase client ──────────────────────────────────
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ── AQI helpers ──────────────────────────────────────
// OWM returns index 1-5; we map to US-EPA-style labels
const AQI_MAP = {
  1: { label: 'Good',      cls: 'good',     color: '#22d3a0', badge: 'bg-good' },
  2: { label: 'Fair',      cls: 'fair',     color: '#a3e635', badge: 'bg-fair' },
  3: { label: 'Moderate',  cls: 'moderate', color: '#facc15', badge: 'bg-moderate' },
  4: { label: 'Poor',      cls: 'poor',     color: '#fb923c', badge: 'bg-poor' },
  5: { label: 'Very Poor', cls: 'verypoor', color: '#f87171', badge: 'bg-verypoor' },
};

const TIPS = {
  1: {
    exercise: 'Great conditions — go for it!',
    windows:  'Open windows for fresh air.',
    mask:     'No mask needed.',
    sensitive:'Safe for all groups.',
  },
  2: {
    exercise: 'Outdoor activity is generally fine.',
    windows:  'Windows can stay open.',
    mask:     'Optional for highly sensitive.',
    sensitive:'Mostly safe; monitor symptoms.',
  },
  3: {
    exercise: 'Reduce prolonged outdoor exertion.',
    windows:  'Keep windows slightly closed.',
    mask:     'Recommended for sensitive groups.',
    sensitive:'Limit time outside.',
  },
  4: {
    exercise: 'Avoid outdoor exercise.',
    windows:  'Keep windows closed.',
    mask:     'Wear an N95 outdoors.',
    sensitive:'Stay indoors as much as possible.',
  },
  5: {
    exercise: 'Do not exercise outdoors.',
    windows:  'Seal gaps; run air purifier.',
    mask:     'N95 mandatory if outdoors.',
    sensitive:'Do not go outside.',
  },
};
