// ═══════════════════════════════════════════════════
//  profile.js — User profile, locations & alerts
// ═══════════════════════════════════════════════════

async function loadProfile() {
  if (!currentUser) return;
  loadSavedLocations();
  loadAlertPrefs();
}

// ── Saved Locations ───────────────────────────────────
async function loadSavedLocations() {
  const container = document.getElementById('savedLocations');
  try {
    const { data, error } = await supabase
      .from('saved_locations')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error || !data?.length) {
      container.innerHTML = '<p class="empty-state">No saved locations yet.</p>';
      return;
    }
    container.innerHTML = data.map(loc => `
      <div class="saved-loc-item" data-id="${loc.id}">
        <span><i class="fas fa-location-dot" style="color:var(--accent);margin-right:8px"></i>${loc.name}</span>
        <i class="fas fa-xmark" onclick="deleteLocation('${loc.id}')"></i>
      </div>`).join('');
  } catch {
    container.innerHTML = '<p class="empty-state">Could not load locations.</p>';
  }
}

async function saveCurrentLocation() {
  if (!currentUser || !userLat || !userLon) {
    showToast('No location available yet — wait for the home page to load.');
    return;
  }
  const name = await reverseGeocode(userLat, userLon);
  try {
    const { error } = await supabase.from('saved_locations').insert({
      user_id: currentUser.id,
      name,
      lat: userLat,
      lon: userLon,
    });
    if (error) throw error;
    showToast(`📍 "${name}" saved`);
    loadSavedLocations();
  } catch (err) {
    showToast('Could not save location: ' + err.message);
  }
}

async function deleteLocation(id) {
  try {
    await supabase.from('saved_locations').delete().eq('id', id);
    showToast('Location removed');
    loadSavedLocations();
  } catch {
    showToast('Could not delete location.');
  }
}

// ── Alert Preferences ─────────────────────────────────
async function loadAlertPrefs() {
  try {
    const { data } = await supabase
      .from('alert_prefs')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (data) {
      document.getElementById('alertThreshold').value = data.threshold || 3;
      document.getElementById('notifToggle').checked  = data.notifications || false;
    }
  } catch { /* no prefs yet */ }
}

async function saveAlertPrefs() {
  if (!currentUser) return;
  const threshold     = parseInt(document.getElementById('alertThreshold').value);
  const notifications = document.getElementById('notifToggle').checked;

  try {
    await supabase.from('alert_prefs').upsert({
      user_id: currentUser.id,
      threshold,
      notifications,
    });
    showToast('✓ Preferences saved');

    // Also call backend to register alert
    if (userLat && userLon && currentUser.email) {
      await subscribeAlerts(userLat, userLon, threshold, currentUser.email, 'email');
    }
  } catch (err) {
    showToast('Could not save preferences.');
  }
}

async function toggleNotifications() {
  const on = document.getElementById('notifToggle').checked;
  if (on && 'Notification' in window) {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      document.getElementById('notifToggle').checked = false;
      showToast('Notification permission denied');
      return;
    }
  }
  saveAlertPrefs();
}

function showEditProfile() {
  const name  = currentUser?.user_metadata?.full_name || '';
  const newName = prompt('Update your display name:', name);
  if (newName && newName.trim()) {
    supabase.auth.updateUser({ data: { full_name: newName.trim() } }).then(({ data, error }) => {
      if (error) { showToast('Update failed'); return; }
      const updated = newName.trim();
      document.getElementById('profileName').textContent    = updated;
      document.getElementById('avatarInitial').textContent  = updated.charAt(0).toUpperCase();
      document.getElementById('profileAvatar').textContent  = updated.charAt(0).toUpperCase();
      showToast('✓ Name updated');
    });
  }
}
