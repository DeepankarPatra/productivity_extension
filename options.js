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
    
    // Load recommendations
    loadRecommendations();
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

async function loadRecommendations() {
  try {
    const result = await chrome.storage.local.get(['siteVisits']);
    const siteVisits = result.siteVisits || {};
    
    const syncData = await chrome.storage.sync.get(['trackedSites']);
    const trackedSites = syncData.trackedSites || [];
    
    const recommendedList = document.getElementById('recommendedSitesList');
    if (!recommendedList) return;
    
    recommendedList.innerHTML = '';
    
    // Sort by count descending
    const sortedSites = Object.entries(siteVisits)
      .sort((a, b) => b[1] - a[1]);
      
    let count = 0;
    for (const [site, visits] of sortedSites) {
      if (!trackedSites.includes(site)) {
        addRecommendationToList(site, visits);
        count++;
        if (count >= 5) break; // Limit to 5
      }
    }
    
    if (count === 0) {
      recommendedList.innerHTML = '<div>No recommendations yet. Browse more sites!</div>';
    }
  } catch (error) {
    console.error('Error loading recommendations:', error);
  }
}

function addRecommendationToList(site, count) {
  const recommendedList = document.getElementById('recommendedSitesList');
  const item = document.createElement('div');
  item.classList.add('site-item');

  const name = document.createElement('div');
  name.classList.add('site-name');
  name.textContent = `${site} (${count} visits)`;

  const addButton = document.createElement('button');
  addButton.textContent = 'Add';
  addButton.classList.add('btn-primary');
  addButton.addEventListener('click', () => {
    addSiteFromRecommendation(site);
  });

  item.appendChild(name);
  item.appendChild(addButton);
  recommendedList.appendChild(item);
}

async function addSiteFromRecommendation(site) {
  const data = await chrome.storage.sync.get(['trackedSites']);
  const trackedSites = data.trackedSites || [];
  if (!trackedSites.includes(site)) {
    const updatedSites = [...trackedSites, site];
    await chrome.storage.sync.set({ trackedSites: updatedSites });
    loadSettings(); // Reloads everything
  }
}

