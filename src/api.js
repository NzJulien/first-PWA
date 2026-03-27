// ═══════════════════════════════════════════════════
//  api.js — FastAPI + Browser Geolocation
// ═══════════════════════════════════════════════════

let userLat = null;
let userLon = null;
let currentAQI = null;

// ── Geolocation ──────────────────────────────────────
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => {
        // Fall back to Buea, Cameroon (default from original app)
        console.warn('Geolocation denied, using default location');
        resolve({ lat: 4.1527, lon: 9.2403 });
      },
      { timeout: 8000 }
    );
  });
}

// ── Reverse Geocode (OpenStreetMap Nominatim — free, no key) ─────────────
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data.address;
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || 'Unknown';
    const country = addr.country_code?.toUpperCase() || '';
    return `${city}${country ? ', ' + country : ''}`;
  } catch {
    return 'Unknown location';
  }
}

// ── Fetch current AQI from our FastAPI backend ───────────────────────────
async function fetchAQI(lat, lon) {
  const res = await fetch(`${API_BASE}/aqi?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}

// ── Fetch forecast ────────────────────────────────────────────────────────
async function fetchForecast(lat, lon) {
  const res = await fetch(`${API_BASE}/forecast?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}

// ── Subscribe to alerts ───────────────────────────────────────────────────
async function subscribeAlerts(lat, lon, threshold, contact, contactType) {
  const res = await fetch(`${API_BASE}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon, threshold, contact, contact_type: contactType }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}

// ── Main AQI loader (used by Home & Insights) ─────────────────────────────
async function loadAQI() {
  const icon = document.getElementById('refreshIcon');
  if (icon) icon.classList.add('spin');

  try {
    const loc   = await getUserLocation();
    userLat     = loc.lat;
    userLon     = loc.lon;

    // Update location pill
    const locName = await reverseGeocode(userLat, userLon);
    const pill    = document.getElementById('locationText');
    if (pill) pill.textContent = locName;

    // Fetch AQI
    const data  = await fetchAQI(userLat, userLon);
    currentAQI  = data;

    renderHomeAQI(data);
    saveLastReading(data);
  } catch (err) {
    console.error('Failed to load AQI:', err);
    renderHomeError('Could not load air quality data. Is the backend running?');
    showToast('⚠ Backend offline — check uvicorn is running');
  } finally {
    if (icon) icon.classList.remove('spin');
  }
}

// ── Render home AQI ───────────────────────────────────────────────────────
function renderHomeAQI(data) {
  const meta = AQI_MAP[data.aqi] || AQI_MAP[3];

  // Ring & number
  document.getElementById('aqiValue').textContent = data.aqi;
  const ring = document.getElementById('heroRing');
  ring.style.borderColor  = meta.color;
  ring.style.boxShadow    = `0 0 28px ${meta.color}44, inset 0 0 14px ${meta.color}18`;

  // Badge
  const badge = document.getElementById('aqiBadge');
  badge.textContent = `◉  ${meta.label}`;
  badge.style.background = `${meta.color}22`;
  badge.style.color      = meta.color;
  badge.style.borderColor= `${meta.color}55`;

  // Description
  document.getElementById('aqiDesc').textContent = data.health_advice;
  document.getElementById('healthAdvice').textContent = data.health_advice;

  // Pollutants
  const p = data.pollutants;
  setPolluant('pm25', p.pm25, 75,  meta.color);
  setPolluant('pm10', p.pm10, 150, meta.color);
  setPolluant('co',   p.co,   10,  meta.color);
  setPolluant('no2',  p.no2,  200, meta.color);

  // Timestamp
  const ts = new Date(data.measured_at);
  document.getElementById('lastUpdated').textContent =
    `Updated ${ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function setPolluant(id, value, max, color) {
  const el   = document.getElementById(id);
  const bar  = document.getElementById(`bar-${id}`);
  if (!el || !bar) return;
  el.textContent  = typeof value === 'number' ? value.toFixed(1) : value;
  const pct       = Math.min(100, (value / max) * 100);
  bar.style.width = `${pct}%`;
  bar.style.background = color;
}

function renderHomeError(msg) {
  document.getElementById('aqiDesc').textContent = msg;
  document.getElementById('aqiValue').textContent = '–';
}

// ── Persist last reading in Supabase (optional) ───────────────────────────
async function saveLastReading(data) {
  if (!currentUser) return;
  try {
    await supabase.from('readings').upsert({
      user_id:    currentUser.id,
      aqi:        data.aqi,
      aqi_label:  data.aqi_label,
      pm25:       data.pollutants.pm25,
      pm10:       data.pollutants.pm10,
      co:         data.pollutants.co,
      no2:        data.pollutants.no2,
      lat:        data.lat,
      lon:        data.lon,
      measured_at: data.measured_at,
    });
  } catch { /* non-critical */ }
}

// ── Toast helper ──────────────────────────────────────────────────────────
function showToast(msg, duration = 3000) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}
