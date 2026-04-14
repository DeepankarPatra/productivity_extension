// List of distracting websites
const DISTRACTING_SITES = [
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'tiktok.com',
  'reddit.com',
  'netflix.com',
  'twitch.tv',
  'discord.com'
];

// Track active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await saveCurrentSession();
  await startNewSession(activeInfo.tabId);
});

// Track URL changes within the same tab
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const result = await chrome.storage.local.get(['activeSession']);
    const activeSession = result.activeSession;
    if (activeSession && tabId === activeSession.tabId) {
      await saveCurrentSession();
      await startNewSession(tabId);
    }
  }
});

// Track window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await saveCurrentSession();
  
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    const [activeTab] = await chrome.tabs.query({active: true, windowId: windowId});
    if (activeTab) {
      await startNewSession(activeTab.id);
    }
  }
});

async function startNewSession(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.storage.local.set({
      activeSession: {
        tabId: tabId,
        url: tab.url,
        startTime: Date.now()
      }
    });
    
    const domain = getDomain(tab.url);
    if (domain) {
      await incrementVisitCount(domain);
    }
  } catch (error) {
    console.error('Error starting session:', error);
  }
}

async function saveCurrentSession() {
  const result = await chrome.storage.local.get(['activeSession']);
  const activeSession = result.activeSession;
  
  if (!activeSession || !activeSession.startTime || !activeSession.url) return;
  
  const sessionTime = (Date.now() - activeSession.startTime) / 1000 / 60; // Convert to minutes
  
  const matchedSite = await getMatchingDistractingSite(activeSession.url);
  // Reduce threshold to 0.01 (approx 0.6 seconds)
  if (sessionTime > 0.01 && matchedSite) {
    await addToTodayUsage(sessionTime, matchedSite);
  }
  
  await chrome.storage.local.remove('activeSession');
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCurrentStats') {
    getCurrentStats().then(stats => sendResponse(stats));
    return true; // Keep channel open for async
  }
});

async function getCurrentStats() {
  const result = await chrome.storage.local.get(['todayUsage', 'siteUsage', 'activeSession']);
  let todayUsage = result.todayUsage || 0;
  let siteUsage = { ...result.siteUsage } || {};
  
  const activeSession = result.activeSession;
  if (activeSession && activeSession.startTime && activeSession.url) {
    const sessionTime = (Date.now() - activeSession.startTime) / 1000 / 60;
    const matchedSite = await getMatchingDistractingSite(activeSession.url);
    if (matchedSite) {
      todayUsage += sessionTime;
      siteUsage[matchedSite] = (siteUsage[matchedSite] || 0) + sessionTime;
    }
  }
  
  const syncResult = await chrome.storage.sync.get(['dailyLimit']);
  const dailyLimit = syncResult.dailyLimit || 120;
  
  return { todayUsage, siteUsage, dailyLimit };
}

async function getMatchingDistractingSite(url) {
  if (!url) return null;
  
  const result = await chrome.storage.sync.get(['trackedSites']);
  const trackedSites = result.trackedSites || DISTRACTING_SITES;
  
  for (const site of trackedSites) {
    try {
      const regex = new RegExp(site, 'i');
      if (regex.test(url)) return site;
    } catch (e) {
      console.error(`Invalid regex pattern: ${site}`, e);
      if (url.toLowerCase().includes(site.toLowerCase())) return site;
    }
  }
  return null;
}

async function addToTodayUsage(minutes, domain) {
  const today = new Date().toDateString();
  
  const result = await chrome.storage.local.get(['todayUsage', 'lastUpdateDate', 'siteUsage']);
  let todayUsage = result.todayUsage || 0;
  let siteUsage = result.siteUsage || {};
  
  // Reset if it's a new day
  if (result.lastUpdateDate !== today) {
    todayUsage = 0;
    siteUsage = {};
    await chrome.storage.local.set({ lastNotification: 0 });
  }
  
  todayUsage += minutes;
  
  if (domain) {
    siteUsage[domain] = (siteUsage[domain] || 0) + minutes;
  }
  
  await chrome.storage.local.set({
    todayUsage: todayUsage,
    siteUsage: siteUsage,
    lastUpdateDate: today
  });
  
  // Check if we should show a notification
  await checkAndNotify(todayUsage);
}

  // Notify at 75
async function checkAndNotify(usage) {
  const syncResult = await chrome.storage.sync.get(['dailyLimit']);
  const localResult = await chrome.storage.local.get(['lastNotification']);
  
  const dailyLimit = syncResult.dailyLimit || 120; // 2 hours default
  const lastNotification = localResult.lastNotification || 0;
  
  // Notify at 75% and 100% of daily limit
  const percentage = (usage / dailyLimit) * 100;
  
  if (percentage >= 100 && lastNotification < 100) {
    showNotification('Daily limit exceeded!', 'You\'ve reached your daily limit for distracting sites.');
    chrome.storage.local.set({ lastNotification: 100 });
  } else if (percentage >= 75 && lastNotification < 75) {
    showNotification('Warning: 75% of daily limit', 'Consider taking a break from distracting sites.');
    chrome.storage.local.set({ lastNotification: 75 });
  }
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message
  });
}

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  // Reset notification flags for new day
  const today = new Date().toDateString();
  const result = await chrome.storage.local.get(['lastUpdateDate']);
  
  if (result.lastUpdateDate !== today) {
    chrome.storage.local.set({ 
      lastNotification: 0,
      lastUpdateDate: today 
    });
  }
});

function getDomain(url) {
  if (!url) return null;
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.protocol.startsWith('http')) return null;
    return parsedUrl.hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

async function incrementVisitCount(domain) {
  if (!domain) return;
  const result = await chrome.storage.local.get(['siteVisits']);
  const siteVisits = result.siteVisits || {};
  siteVisits[domain] = (siteVisits[domain] || 0) + 1;
  await chrome.storage.local.set({ siteVisits });
}

