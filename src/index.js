// ─────────────────────────────────────────────
// JS PATCHES for master.css v2
// Replace the matching functions in your index.js
// ─────────────────────────────────────────────

// 1. Add this helper — returns the CSS class key for current AQI
function getAQIClass(aqi) {
    if (aqi <= 50)  return 'aqi-good';
    if (aqi <= 100) return 'aqi-moderate';
    if (aqi <= 150) return 'aqi-sensitive';
    if (aqi <= 200) return 'aqi-unhealthy';
    return 'aqi-very-unhealthy';
}

// All AQI level classes (used to cleanly swap)
const AQI_CLASSES = ['aqi-good','aqi-moderate','aqi-sensitive','aqi-unhealthy','aqi-very-unhealthy'];

// ─────────────────────────────────────────────
// 2. Replace your refreshDisplay() with this:
// ─────────────────────────────────────────────
function refreshDisplay() {
    const aqiClass = getAQIClass(airData.aqi);
    const { statusText, adviceMsg, healthText, iconHtml } = updateAQICategory(airData.aqi);

    // — AQI number with color class + pulse animation
    const aqiValueEl = document.getElementById('aqiValue');
    aqiValueEl.classList.remove(...AQI_CLASSES, 'refreshing');
    void aqiValueEl.offsetWidth; // force reflow so animation re-triggers
    aqiValueEl.classList.add(aqiClass, 'refreshing');

    // — Count-up animation for the number
    animateCount(aqiValueEl, parseInt(aqiValueEl.dataset.prev || 0), airData.aqi, 400);
    aqiValueEl.dataset.prev = airData.aqi;

    // — Status & message
    document.getElementById('aqiStatus').innerHTML = `${iconHtml} ${statusText}`;
    document.getElementById('aqiMessage').innerText = adviceMsg;
    document.getElementById('healthAdvice').innerText = healthText;

    // — AQI section background class
    const aqiSection = document.querySelector('.aqi-section');
    aqiSection.classList.remove(...AQI_CLASSES);
    aqiSection.classList.add(aqiClass);

    // — Alert card color class
    const alertCard = document.getElementById('alertCard');
    alertCard.classList.remove(...AQI_CLASSES);
    alertCard.classList.add(aqiClass);

    // — Stats with fade animation
    const statFields = ['pm25','pm10','co','no2'];
    statFields.forEach(id => {
        const el = document.getElementById(id);
        el.classList.remove('updating');
        void el.offsetWidth;
        el.classList.add('updating');
    });
    document.getElementById('pm25').innerHTML = airData.pm25;
    document.getElementById('pm10').innerHTML = airData.pm10;
    document.getElementById('co').innerHTML   = airData.co.toFixed(1);
    document.getElementById('no2').innerHTML  = airData.no2;
}

// ─────────────────────────────────────────────
// 3. Add this count-up helper
// ─────────────────────────────────────────────
function animateCount(el, from, to, duration) {
    const start = performance.now();
    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.innerText = Math.round(from + (to - from) * eased);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ─────────────────────────────────────────────
// 4. Replace openModal() to use .modal-row markup
// ─────────────────────────────────────────────
function openModal(title, rows) {
    // rows = array of { icon, label, value } OR a raw HTML string (legacy)
    document.getElementById('modalTitle').innerText = title;
    const body = document.getElementById('modalBody');

    if (typeof rows === 'string') {
        // legacy fallback — wrap plain text in rows
        body.innerHTML = rows;
    } else {
        body.innerHTML = rows.map(r => `
            <div class="modal-row">
                <i class="${r.icon}"></i>
                <span><strong>${r.label}</strong> ${r.value}</span>
            </div>
        `).join('') + `<div class="modal-footer">AuraSense • ${new Date().toLocaleTimeString()}</div>`;
    }

    const modal = document.getElementById('globalModal');
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
}

// ─────────────────────────────────────────────
// 5. Update handleMenu() — uses new modal rows
// ─────────────────────────────────────────────
window.handleMenu = function(type) {
    document.getElementById('dropdown').style.display = 'none';

    if (type === 'details') {
        openModal("Air Quality Details", [
            { icon: 'fas fa-microscope',   label: 'PM2.5:',    value: `${airData.pm25} µg/m³` },
            { icon: 'fas fa-wind',         label: 'PM10:',     value: `${airData.pm10} µg/m³` },
            { icon: 'fas fa-industry',     label: 'CO:',       value: `${airData.co} ppm` },
            { icon: 'fas fa-leaf',         label: 'NO₂:',      value: `${airData.no2} ppb` },
            { icon: 'fas fa-map-marker-alt', label: 'Location:', value: 'Buea, Cameroon' },
            { icon: 'fas fa-chart-line',   label: 'AQI:',      value: `${airData.aqi} — ${updateAQICategory(airData.aqi).statusText}` },
        ]);
    } else if (type === 'alerts') {
        openModal("Alerts & Notifications", [
            { icon: 'fas fa-bell',      label: 'Status:',        value: airData.aqi > 100 ? 'Unhealthy for sensitive groups.' : 'No severe alerts.' },
            { icon: 'fas fa-stethoscope', label: 'Advice:',      value: airData.healthAdvice },
            { icon: 'fas fa-clock',     label: 'Next forecast:', value: 'Air quality stable for 24h.' },
        ]);
    } else if (type === 'settings') {
        openModal("Settings & Preferences", [
            { icon: 'fas fa-moon',      label: 'Theme:',         value: 'Dark (adaptive)' },
            { icon: 'fas fa-bell',      label: 'Notifications:', value: 'On' },
            { icon: 'fas fa-globe',     label: 'Units:',         value: 'Metric (µg/m³)' },
            { icon: 'fas fa-sync-alt',  label: 'Auto-refresh:',  value: 'Every 3 minutes' },
            { icon: 'fas fa-info-circle', label: 'Version:',     value: '2.0 — AuraSense' },
        ]);
    }
};

// ─────────────────────────────────────────────
// 6. Update HTML — add .primary class + badge to PM2.5 stat
//    In your index.html, replace the first .stat block with:
// ─────────────────────────────────────────────
/*
<div class="stat primary">
    <div class="stat-label">
        <p><i class="fas fa-microscope"></i> PM2.5</p>
        <span class="primary-badge">Key Pollutant</span>
    </div>
    <h4 id="pm25">35</h4>
</div>
*/