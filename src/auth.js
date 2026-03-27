// ═══════════════════════════════════════════════════
//  auth.js — Supabase Authentication
// ═══════════════════════════════════════════════════

let currentUser = null;

function switchForm(which) {
  document.getElementById('form-login').classList.add('hidden');
  document.getElementById('form-register').classList.add('hidden');
  document.getElementById('form-confirm').classList.add('hidden');
  document.getElementById(`form-${which}`).classList.remove('hidden');
  clearAuthErrors();
}

function clearAuthErrors() {
  document.getElementById('login-error').textContent = '';
  document.getElementById('reg-error').textContent   = '';
}

function togglePwd(id, icon) {
  const inp = document.getElementById(id);
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  icon.classList.toggle('fa-eye', !show);
  icon.classList.toggle('fa-eye-slash', show);
}

async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.textContent = '';

  if (!email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }

  const btn = document.querySelector('#form-login .btn-primary');
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Signing in…';
  btn.disabled = true;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    onAuthSuccess(data.user);
  } catch (err) {
    errEl.textContent = err.message || 'Login failed.';
  } finally {
    btn.innerHTML = '<span>Sign in</span><i class="fas fa-arrow-right"></i>';
    btn.disabled = false;
  }
}

async function handleRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl    = document.getElementById('reg-error');
  errEl.textContent = '';

  if (!name || !email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }
  if (password.length < 6)          { errEl.textContent = 'Password must be at least 6 characters.'; return; }

  const btn = document.querySelector('#form-register .btn-primary');
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Creating…';
  btn.disabled = true;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) throw error;

    // If Supabase requires email confirmation
    if (data.user && !data.session) {
      document.getElementById('confirm-email-display').textContent = email;
      switchForm('confirm');
    } else if (data.user) {
      currentUser = data.user;
      onAuthSuccess(data.user);
    }
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed.';
  } finally {
    btn.innerHTML = '<span>Create account</span><i class="fas fa-arrow-right"></i>';
    btn.disabled = false;
  }
}

async function handleLogout() {
  await supabase.auth.signOut();
  currentUser = null;
  showScreen('auth');
  switchForm('login');
  document.getElementById('login-email').value    = '';
  document.getElementById('login-password').value = '';
}

function onAuthSuccess(user) {
  currentUser = user;
  const name    = user.user_metadata?.full_name || user.email.split('@')[0];
  const initial = name.charAt(0).toUpperCase();

  // Update avatar in header
  document.getElementById('avatarInitial').textContent = initial;
  // Update profile page
  document.getElementById('profileAvatar').textContent = initial;
  document.getElementById('profileName').textContent   = name;
  document.getElementById('profileEmail').textContent  = user.email;

  showScreen('app');
  initApp();
}

// Check existing session on load
async function checkSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    currentUser = data.session.user;
    onAuthSuccess(data.session.user);
  } else {
    showScreen('auth');
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      currentUser = session.user;
    } else {
      currentUser = null;
    }
  });
}

function showScreen(which) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  const el = document.getElementById(`screen-${which}`);
  el.classList.remove('hidden');
  el.classList.add('active');
}
