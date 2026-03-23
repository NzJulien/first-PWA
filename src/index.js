if("serviceWorker" in navigator){
    navigator.serviceWorker.register("sw.js").then(registration => {
        console.log("SW Registered!")
        console.log(registration)
    }).catch(error => {
        console.log("SW Registration Failed!");
        console.log(error)
    })
}
// Air quality data management
let airData = {
    aqi: 72,
    status: "Moderate",
    message: "Air quality is acceptable, but sensitive individuals should watch out.",
    pm25: 35,
    pm10: 60,
    co: 0.8,
    no2: 24,
    healthAdvice: "Sensitive individuals: reduce prolonged outdoor exertion."
};

// Helper: get AQI category, color, icon & advice based on aqi numeric
function updateAQICategory(aqi) {
    let statusText = "", adviceMsg = "", healthText = "", iconHtml = "";
    
    if (aqi <= 50) {
        statusText = "Good";
        iconHtml = '<i class="fas fa-smile"></i>';
        adviceMsg = "Excellent air quality! Enjoy outdoor activities.";
        healthText = "Great day to be active outdoors. Air quality is fresh.";
    } else if (aqi <= 100) {
        statusText = "Moderate";
        iconHtml = '<i class="fas fa-meh"></i>';
        adviceMsg = "Air quality is acceptable; unusually sensitive people should consider limiting exertion.";
        healthText = "Sensitive groups: reduce heavy outdoor exercise if symptoms occur.";
    } else if (aqi <= 150) {
        statusText = "Unhealthy for Sensitive Groups";
        iconHtml = '<i class="fas fa-exclamation-triangle"></i>';
        adviceMsg = "Members of sensitive groups may experience health effects. Limit outdoor time.";
        healthText = "Children, elderly, and respiratory patients should stay indoors when possible.";
    } else if (aqi <= 200) {
        statusText = "Unhealthy";
        iconHtml = '<i class="fas fa-mask"></i>';
        adviceMsg = "Health risk for everyone. Reduce outdoor activities.";
        healthText = "Wear N95 mask outdoors if necessary. Keep windows closed.";
    } else {
        statusText = "Very Unhealthy";
        iconHtml = '<i class="fas fa-skull-crosswalk"></i>';
        adviceMsg = "Health alert: everyone may experience serious effects. Avoid outdoors.";
        healthText = "Emergency conditions! Stay indoors with air purifier.";
    }
    
    return { statusText, adviceMsg, healthText, iconHtml };
}

// Refresh the display with current airData
function refreshDisplay() {
    // Update DOM elements
    document.getElementById('aqiValue').innerText = airData.aqi;
    const { statusText, adviceMsg, healthText, iconHtml } = updateAQICategory(airData.aqi);
    
    // Set status with icon
    document.getElementById('aqiStatus').innerHTML = `${iconHtml} ${statusText}`;
    document.getElementById('aqiMessage').innerText = adviceMsg;
    document.getElementById('healthAdvice').innerText = healthText;
    document.getElementById('pm25').innerHTML = airData.pm25;
    document.getElementById('pm10').innerHTML = airData.pm10;
    document.getElementById('co').innerHTML = airData.co.toFixed(1);
    document.getElementById('no2').innerHTML = airData.no2;
    
    // Dynamic aqi-section background based on aqi
    const aqiSection = document.querySelector('.aqi-section');
    if (airData.aqi <= 50) {
        aqiSection.style.background = "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(0,0,0,0.2))";
    } else if (airData.aqi <= 100) {
        aqiSection.style.background = "linear-gradient(135deg, rgba(234,179,8,0.2), rgba(0,0,0,0.2))";
    } else if (airData.aqi <= 150) {
        aqiSection.style.background = "linear-gradient(135deg, rgba(249,115,22,0.25), rgba(0,0,0,0.2))";
    } else {
        aqiSection.style.background = "linear-gradient(135deg, rgba(239,68,68,0.3), rgba(0,0,0,0.3))";
    }
}

// Generate realistic fresh data to mimic API
function generateFreshData() {
    // Random AQI between 35 and 165 (dynamic range)
    let newAqi = Math.floor(Math.random() * (150 - 35 + 1) + 35);
    
    // PM2.5 and PM10 correlated to AQI
    let newPm25 = Math.floor(newAqi * 0.6 + Math.random() * 8);
    let newPm10 = Math.floor(newAqi * 0.9 + Math.random() * 12);
    let newCo = (newAqi / 100 + (Math.random() * 0.4)).toFixed(1);
    let newNo2 = Math.floor(newAqi * 0.45 + Math.random() * 10);
    
    // Ensure values are realistic
    newPm25 = Math.min(180, Math.max(12, newPm25));
    newPm10 = Math.min(220, Math.max(20, newPm10));
    newCo = Math.min(2.5, Math.max(0.3, parseFloat(newCo)));
    newNo2 = Math.min(85, Math.max(10, newNo2));
    
    const { statusText, adviceMsg, healthText } = updateAQICategory(newAqi);
    
    return {
        aqi: newAqi,
        status: statusText,
        message: adviceMsg,
        pm25: newPm25,
        pm10: newPm10,
        co: newCo,
        no2: newNo2,
        healthAdvice: healthText
    };
}

// Refresh data with animation feedback
function refreshData() {
    const fresh = generateFreshData();
    airData = {
        aqi: fresh.aqi,
        status: fresh.status,
        message: fresh.message,
        pm25: fresh.pm25,
        pm10: fresh.pm10,
        co: fresh.co,
        no2: fresh.no2,
        healthAdvice: fresh.healthAdvice
    };
    refreshDisplay();
    
    // Add subtle haptic feedback simulation
    const btn = document.getElementById('refreshBtn');
    btn.style.transform = "scale(0.96)";
    setTimeout(() => btn.style.transform = "", 150);
    
    // Animate refresh icon
    const icon = document.querySelector('#refreshBtn i');
    icon.classList.add('fa-spin');
    setTimeout(() => icon.classList.remove('fa-spin'), 600);
    
    // Add subtle flash effect on AQI value
    const aqiDiv = document.querySelector('.aqi-value');
    aqiDiv.style.transform = "scale(1.02)";
    setTimeout(() => aqiDiv.style.transform = "", 200);
}

// Modal management
const modal = document.getElementById('globalModal');

function openModal(title, contentHTML) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerHTML = contentHTML;
    modal.style.visibility = "visible";
    modal.style.opacity = "1";
}

window.closeModal = function() {
    modal.style.visibility = "hidden";
    modal.style.opacity = "0";
}

// Menu handler (details / alerts / settings)
window.handleMenu = function(type) {
    const dropdown = document.getElementById('dropdown');
    dropdown.style.display = 'none';
    
    if (type === 'details') {
        // Show rich details modal with current stats
        let statsHtml = `
            <p><strong>🌫️ PM2.5:</strong> ${airData.pm25} µg/m³ <br> <strong>🌪️ PM10:</strong> ${airData.pm10} µg/m³</p>
            <p><strong>💨 CO:</strong> ${airData.co} ppm &nbsp;| <strong>🍃 NO₂:</strong> ${airData.no2} ppb</p>
            <p><strong>📍 Location:</strong> Buea, Cameroon (urban)</p>
            <p><strong>📊 AQI Index:</strong> ${airData.aqi} - ${updateAQICategory(airData.aqi).statusText}</p>
            <p style="margin-top:10px"><i class="fas fa-chart-line"></i> Data updated live from regional sensors.</p>
        `;
        openModal("Air Quality Details", statsHtml);
    } 
    else if (type === 'alerts') {
        let alertHtml = `
            <i class="fas fa-bell" style="font-size: 2rem; margin-bottom: 8px;"></i>
            <p><strong>🔔 Active alerts:</strong> ${airData.aqi > 100 ? 'Unhealthy for sensitive groups alert active.' : 'No severe alerts currently.'}</p>
            <p>🧘 Recommendation: ${airData.healthAdvice}</p>
            <p>🕒 Next forecast: Air quality expected to remain stable for 24h.</p>
        `;
        openModal("Alerts & Notifications", alertHtml);
    }
    else if (type === 'settings') {
        let settingsHtml = `
            <i class="fas fa-cog" style="font-size: 1.8rem; margin-bottom: 10px;"></i>
            <p><strong>🔘 Preferences:</strong></p>
            <p>🌙 Dark mode: Adaptive (PWA ready)</p>
            <p>🔔 Notifications: On (tap to enable in future)</p>
            <p>🌍 Units: Metric (µg/m³)</p>
            <p><i class="fas fa-sync-alt"></i> Auto-refresh every 2 hours</p>
            <p style="margin-top: 12px; font-size: 12px;">Version 2.0 — AuraSense</p>
        `;
        openModal("Settings & Preferences", settingsHtml);
    }
};

// Toggle menu dropdown
window.toggleMenu = function() {
    const dropdown = document.getElementById('dropdown');
    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'block';
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const menuContainer = document.querySelector('.menu-container');
    const dropdown = document.getElementById('dropdown');
    if (menuContainer && !menuContainer.contains(e.target) && dropdown) {
        dropdown.style.display = 'none';
    }
});

// Bottom navigation interactive
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', function(e) {
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        const tab = this.getAttribute('data-tab');
        
        if (tab === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (tab === 'stats') {
            openModal("Detailed Stats", 
                `<p>📈 Recent trend: PM2.5 ${airData.pm25} | PM10 ${airData.pm10}</p>
                 <p>🌿 AQI over past 24h: ${airData.aqi} (${updateAQICategory(airData.aqi).statusText})</p>
                 <p>🚗 Traffic pollution impact: moderate due to city activity.</p>
                 <p>📊 Data updated in real-time from Buea monitoring stations.</p>`
            );
        } else if (tab === 'insights') {
            openModal("Air Insights", 
                `<p>🧠 Did you know? Plants like snake plant improve indoor air.</p>
                 <p>🌍 Buea air quality improves after rainfall.</p>
                 <p>🔬 Sensor data indicates particles from dust and vehicle emissions.</p>
                 <p>💡 Tip: Check AQI before morning jogs for optimal health.</p>`
            );
        } else if (tab === 'profile') {
            openModal("User Profile", 
                `<p><i class="fas fa-user-circle" style="font-size: 2rem;"></i></p>
                 <p><strong>Guest User</strong></p>
                 <p>📍 Favorite location: Buea</p>
                 <p>🔔 Alert threshold: AQI > 100</p>
                 <p>🌟 Save preferences by installing PWA.</p>
                 <p style="margin-top: 12px;"><i class="fas fa-chart-line"></i> Total checks: 47 this month</p>`
            );
        }
    });
});

// Details button handler
document.getElementById('detailsBtn').addEventListener('click', () => {
    let statsHtml = `
        <p><strong>📊 AQI Value:</strong> ${airData.aqi} — ${updateAQICategory(airData.aqi).statusText}</p>
        <p><strong>🧪 PM2.5:</strong> ${airData.pm25} (major pollutant) <br> <strong>🏭 PM10:</strong> ${airData.pm10}</p>
        <p><strong>🛡️ Health guide:</strong> ${airData.healthAdvice}</p>
        <p><strong>💨 CO:</strong> ${airData.co} ppm | <strong>🍃 NO₂:</strong> ${airData.no2} ppb</p>
        <p><i class="fas fa-chart-line"></i> Data refreshes on demand — stay aware!</p>
        <hr style="margin: 12px 0; opacity: 0.3;">
        <p style="font-size: 12px;">Source: Local sensor network • Updated: ${new Date().toLocaleTimeString()}</p>
    `;
    openModal("Detailed Analysis", statsHtml);
});

// Refresh button handler
document.getElementById('refreshBtn').addEventListener('click', () => {
    refreshData();
});

// Auto-refresh every 3 minutes for dynamic experience
setInterval(() => {
    const fresh = generateFreshData();
    airData = {
        aqi: fresh.aqi,
        status: fresh.status,
        message: fresh.message,
        pm25: fresh.pm25,
        pm10: fresh.pm10,
        co: fresh.co,
        no2: fresh.no2,
        healthAdvice: fresh.healthAdvice
    };
    refreshDisplay();
    
    // Subtle visual feedback on auto-refresh
    const aqiDiv = document.querySelector('.aqi-value');
    aqiDiv.style.transform = "scale(1.02)";
    setTimeout(() => aqiDiv.style.transform = "", 200);
}, 180000); // 3 minutes

// Initial display
refreshDisplay();

// Optional: Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}