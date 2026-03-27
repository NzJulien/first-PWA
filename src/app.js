// ═══════════════════════════════════════════════════
//  app.js — Main controller & page router
// ═══════════════════════════════════════════════════

// ── Page navigation ──────────────────────────────────
function switchPage(name, btn) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });

  // Show target
  const target = document.getElementById(`page-${name}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
  }

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // Lazy-load per page
  if (name === 'maps') {
    setTimeout(() => {
      initMap();
      onMapTabVisible();
    }, 50);
  }
  if (name === 'insights') {
    loadInsights();
  }
  if (name === 'profile') {
    loadProfile();
  }
}

// ── App boot (called after successful auth) ─────────
function initApp() {
  // Show home, hide others
  switchPage('home', document.querySelector('[data-page="home"]'));
  loadAQI();
}

// ── Bootstrap on DOM ready ───────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});
