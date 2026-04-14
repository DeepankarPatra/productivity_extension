// Load data when popup opens
document.addEventListener('DOMContentLoaded', function () {
  loadTodayStats();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('resetBtn').addEventListener('click', resetToday);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
}

async function loadTodayStats() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCurrentStats' });
    
    if (!response) {
      console.error('No response from background script');
      return;
    }

    const { todayUsage, siteUsage, dailyLimit } = response;

    updateProgressBar(todayUsage, dailyLimit);
    updateStatsDisplay(todayUsage);
    updateSiteStatsDisplay(siteUsage);
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function updateSiteStatsDisplay(siteUsage) {
  const siteStatsDiv = document.getElementById('siteStats');

  if (Object.keys(siteUsage).length === 0) {
    siteStatsDiv.innerHTML = '<div>No data for today yet.</div>';
    return;
  }

  // Sort by time spent
  const sortedSites = Object.entries(siteUsage).sort((a, b) => b[1] - a[1]);

  let html = '<ul class="site-list">';
  for (const [site, minutes] of sortedSites) {
    if (minutes < 0.1) continue; // Skip very small times
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    const timeText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    html += `<li class="site-item">
      <span class="site-name">${site}</span>
      <span class="site-time">${timeText}</span>
    </li>`;
  }
  html += '</ul>';

  siteStatsDiv.innerHTML = html;
}

function updateProgressBar(usage, limit) {
  const percentage = Math.min((usage / limit) * 100, 100);
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  progressFill.style.width = percentage + '%';
  progressText.textContent = `${Math.round(usage)} / ${limit} minutes`;

  // Change color based on usage
  progressFill.className = 'progress-fill';
  if (percentage > 80) {
    progressFill.classList.add('danger');
  } else if (percentage > 60) {
    progressFill.classList.add('warning');
  }
}

function updateStatsDisplay(usage) {
  const hours = Math.floor(usage / 60);
  const minutes = Math.round(usage % 60);
  const timeText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  document.getElementById('dailyStats').innerHTML = `
    <div>Time on distracting sites: ${timeText}</div>
    <div>Status: ${getStatusText(usage)}</div>
  `;
}

function getStatusText(usage) {
  if (usage < 30) return "😊 Great focus!";
  if (usage < 60) return "😐 Moderate usage";
  if (usage < 120) return "😬 Getting high";
  return "😵 Way too much!";
}

function resetToday() {
  if (confirm('Reset today\'s usage data?')) {
    chrome.storage.local.set({
      todayUsage: 0,
      lastResetDate: new Date().toDateString()
    }, () => {
      loadTodayStats();
    });
  }
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}

