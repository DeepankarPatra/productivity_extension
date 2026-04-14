// Load saved settings from Chrome storage
function loadSettings() {
  chrome.storage.sync.get(['trackedSites', 'dailyLimit', 'notificationsEnabled'], (data) => {
    // Load tracked sites
    const sitesList = document.getElementById('sitesList');
    sitesList.innerHTML = '';
    const trackedSites = data.trackedSites || [];
    trackedSites.forEach((site) => {
      addSiteToList(site);
    });

    // Load daily limit
    document.getElementById('dailyLimit').value = data.dailyLimit || 120;

    // Load notifications setting
    document.getElementById('notificationsEnabled').checked = data.notificationsEnabled !== false;
  });
}

// Add a new site to the tracked sites list
function addSiteToList(site) {
  const sitesList = document.getElementById('sitesList');
  const siteItem = document.createElement('div');
  siteItem.classList.add('site-item');

  const siteName = document.createElement('div');
  siteName.classList.add('site-name');
  siteName.textContent = site;

  const removeButton = document.createElement('button');
  removeButton.textContent = 'Remove';
  removeButton.addEventListener('click', () => {
    removeSiteFromList(site);
  });

  siteItem.appendChild(siteName);
  siteItem.appendChild(removeButton);
  sitesList.appendChild(siteItem);
}

// Remove a site from the tracked sites list
function removeSiteFromList(site) {
  chrome.storage.sync.get(['trackedSites'], (data) => {
    const trackedSites = data.trackedSites || [];
    const updatedSites = trackedSites.filter((s) => s !== site);
    chrome.storage.sync.set({ trackedSites: updatedSites }, () => {
      loadSettings();
    });
  });
}

// Save settings to Chrome storage
function saveSettings() {
  const dailyLimit = document.getElementById('dailyLimit').value;
  const notificationsEnabled = document.getElementById('notificationsEnabled').checked;

  chrome.storage.sync.get(['trackedSites'], (data) => {
    chrome.storage.sync.set({
      dailyLimit,
      notificationsEnabled,
      trackedSites: data.trackedSites,
    }, () => {
      showSaveMessage();
    });
  });
}

// Reset settings to defaults
function resetToDefaults() {
  chrome.storage.sync.set({
    dailyLimit: 120,
    notificationsEnabled: true,
    trackedSites: [],
  }, () => {
    loadSettings();
    showSaveMessage();
  });
}

// Show save message
function showSaveMessage() {
  const saveMessage = document.getElementById('saveMessage');
  saveMessage.classList.add('visible');
  setTimeout(() => {
    saveMessage.classList.remove('visible');
  }, 3000);
}

// Add new site to the list
document.getElementById('addSite').addEventListener('click', () => {
  const newSite = document.getElementById('newSite').value.trim().toLowerCase();
  if (newSite) {
    chrome.storage.sync.get(['trackedSites'], (data) => {
      const trackedSites = data.trackedSites || [];
      if (!trackedSites.includes(newSite)) {
        const updatedSites = [...trackedSites, newSite];
        chrome.storage.sync.set({ trackedSites: updatedSites }, () => {
          document.getElementById('newSite').value = '';
          addSiteToList(newSite);
        });
      } else {
        alert(`${newSite} is already being tracked.`);
      }
    });
  }
});

// Save settings
document.getElementById('saveSettings').addEventListener('click', saveSettings);

// Reset to defaults
document.getElementById('resetToDefaults').addEventListener('click', resetToDefaults);

// Load settings on page load
loadSettings();

