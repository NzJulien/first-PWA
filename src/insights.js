// ═══════════════════════════════════════════════════
//  insights.js — Forecast chart & recommendations
// ═══════════════════════════════════════════════════

let forecastChart = null;

async function loadInsights() {
  if (!userLat || !userLon) {
    // Try to get location first
    try {
      const loc = await getUserLocation();
      userLat = loc.lat;
      userLon = loc.lon;
    } catch {
      return;
    }
  }

  try {
    const data = await fetchForecast(userLat, userLon);
    renderForecastChart(data);
    renderForecastList(data);
    renderTips();
  } catch (err) {
    console.error('Forecast error:', err);
    showToast('Could not load forecast data');
  }
}

function renderForecastChart(data) {
  const hours = data.hourly.slice(0, 24);
  const labels = hours.map(h => {
    const d = new Date(h.dt);
    return d.getHours() === 0
      ? d.toLocaleDateString('en', { weekday: 'short' })
      : `${d.getHours()}h`;
  });
  const values = hours.map(h => h.aqi);
  const colors = hours.map(h => (AQI_MAP[h.aqi] || AQI_MAP[3]).color);

  const ctx = document.getElementById('forecastChart').getContext('2d');
  if (forecastChart) forecastChart.destroy();

  forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: '#38bdf8',
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 180);
          gradient.addColorStop(0, 'rgba(56,189,248,0.25)');
          gradient.addColorStop(1, 'rgba(56,189,248,0.0)');
          return gradient;
        },
        pointBackgroundColor: colors,
        pointBorderColor: 'rgba(255,255,255,0.6)',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 1, max: 5,
          ticks: {
            color: '#4d6a8a',
            font: { family: 'DM Sans', size: 11 },
            callback: v => ['', 'Good', 'Fair', 'Mod.', 'Poor', 'V.Poor'][v] || v,
            stepSize: 1,
          },
          grid: { color: 'rgba(255,255,255,0.05)' },
          border: { color: 'transparent' },
        },
        x: {
          ticks: { color: '#4d6a8a', font: { family: 'DM Sans', size: 10 }, maxRotation: 0 },
          grid: { display: false },
          border: { color: 'transparent' },
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,22,40,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#8ba8d0',
          bodyColor: '#e8f0fe',
          titleFont: { family: 'DM Sans', size: 11 },
          bodyFont: { family: 'Syne', size: 14, weight: '700' },
          callbacks: {
            label: ctx => `AQI ${ctx.parsed.y} — ${(AQI_MAP[ctx.parsed.y] || AQI_MAP[3]).label}`,
          }
        }
      }
    }
  });
}

function renderForecastList(data) {
  const container = document.getElementById('forecastItems');
  const hours     = data.hourly.slice(0, 48);
  container.innerHTML = hours.map(h => {
    const d    = new Date(h.dt);
    const time = d.toLocaleString('en', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    const meta = AQI_MAP[h.aqi] || AQI_MAP[3];
    return `
      <div class="forecast-row">
        <span class="fr-time">${time}</span>
        <span class="fr-label" style="color:${meta.color}">${meta.label}</span>
        <span class="fr-aqi" style="color:${meta.color}">${h.aqi}</span>
      </div>`;
  }).join('');
}

function renderTips() {
  const aqi  = currentAQI?.aqi || 3;
  const tips = TIPS[aqi] || TIPS[3];
  document.getElementById('tip-exercise').textContent = tips.exercise;
  document.getElementById('tip-windows').textContent  = tips.windows;
  document.getElementById('tip-mask').textContent     = tips.mask;
  document.getElementById('tip-sensitive').textContent = tips.sensitive;
}
