// ═══════════════════════════════════════════════════
//  map.js — Leaflet World Air Quality Map
// ═══════════════════════════════════════════════════

let leafletMap   = null;
let mapInitDone  = false;
let mapMarker    = null;

function initMap() {
  if (mapInitDone) return;
  mapInitDone = true;

  leafletMap = L.map('worldMap', {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    zoomControl: true,
    attributionControl: false,
  });

  // Dark tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18,
  }).addTo(leafletMap);

  // Attribution (small, styled)
  L.control.attribution({ prefix: false, position: 'bottomleft' })
    .addAttribution('<span style="color:#4d6a8a;font-size:9px">© OpenStreetMap contributors</span>')
    .addTo(leafletMap);

  // Tap handler
  leafletMap.on('click', async (e) => {
    const { lat, lng } = e.latlng;
    await fetchAndShowMapAQI(lat, lng);
  });

  // If user coords are available, fly there
  if (userLat && userLon) {
    leafletMap.setView([userLat, userLon], 7);
    addUserMarker(userLat, userLon);
  }
}

function addUserMarker(lat, lon) {
  if (mapMarker) mapMarker.remove();

  const icon = L.divIcon({
    html: `<div style="
      width:16px;height:16px;
      background:#38bdf8;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 0 12px #38bdf855;
    "></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  mapMarker = L.marker([lat, lon], { icon }).addTo(leafletMap);
}

async function fetchAndShowMapAQI(lat, lon) {
  const panel = document.getElementById('mapInfoPanel');
  panel.innerHTML = `<span style="color:var(--text2)"><i class="fas fa-circle-notch fa-spin" style="color:var(--accent)"></i> &nbsp;Fetching AQI for this location…</span>`;

  // Drop a temp marker
  if (mapMarker) mapMarker.remove();
  const pulseIcon = L.divIcon({
    html: `<div style="
      width:20px;height:20px;
      background:rgba(56,189,248,.3);
      border:2px solid #38bdf8;
      border-radius:50%;
      animation:ping .8s ease-out infinite;
    "></div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
  mapMarker = L.marker([lat, lon], { icon: pulseIcon }).addTo(leafletMap);

  try {
    const [aqiData, locationName] = await Promise.all([
      fetchAQI(lat, lon),
      reverseGeocode(lat, lon),
    ]);

    const meta = AQI_MAP[aqiData.aqi] || AQI_MAP[3];
    const p    = aqiData.pollutants;

    // Solid marker with AQI colour
    if (mapMarker) mapMarker.remove();
    const solidIcon = L.divIcon({
      html: `<div style="
        width:18px;height:18px;
        background:${meta.color};
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 0 14px ${meta.color}88;
      "></div>`,
      className: '',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    mapMarker = L.marker([lat, lon], { icon: solidIcon }).addTo(leafletMap);

    panel.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-size:.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:1px">${locationName}</div>
          <div style="font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:800;color:${meta.color}">${aqiData.aqi} AQI</div>
          <div style="font-size:.75rem;color:${meta.color};font-weight:600">${meta.label}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <span style="background:rgba(255,255,255,.06);border-radius:8px;padding:5px 10px;font-size:.75rem;">PM2.5 <b>${p.pm25.toFixed(1)}</b></span>
          <span style="background:rgba(255,255,255,.06);border-radius:8px;padding:5px 10px;font-size:.75rem;">PM10 <b>${p.pm10.toFixed(1)}</b></span>
          <span style="background:rgba(255,255,255,.06);border-radius:8px;padding:5px 10px;font-size:.75rem;">NO₂ <b>${p.no2.toFixed(1)}</b></span>
        </div>
      </div>`;
  } catch {
    panel.innerHTML = `<span style="color:#f87171"><i class="fas fa-triangle-exclamation"></i> &nbsp;Could not load AQI — check backend</span>`;
  }
}

function toggleLegend() {
  document.getElementById('map-legend').classList.toggle('hidden');
}

// Ensure map resizes when tab becomes visible
function onMapTabVisible() {
  if (leafletMap) {
    setTimeout(() => leafletMap.invalidateSize(), 100);
    if (userLat && userLon && !mapInitDone) {
      leafletMap.setView([userLat, userLon], 7);
      addUserMarker(userLat, userLon);
    }
  }
}
