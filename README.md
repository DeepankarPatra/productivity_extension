# Productivity Tracker

A Chrome extension to help you track and limit time spent on distracting websites.

## Features

-   📊 **Total Usage Stats**: See how much time you've spent on distracting sites today (updated in real-time).
-   🌐 **Per-Site Tracking**: View a breakdown of time spent on each specific distracting website.
-   ⏱️ **Daily Limits**: Set a daily limit for distracting sites.
-   🔔 **Smart Notifications**: Get notified when you reach 75% and 100% of your daily limit.
-   🎨 **Customizable**: Add your own distracting sites and set custom limits.
-   💡 **Smart Recommendations**: Get suggestions for sites to track based on your browsing frequency.

## Installation

To install this extension in Chrome:

1.  Clone or download this repository to your local machine.
2.  Open Google Chrome.
3.  Navigate to `chrome://extensions/`.
4.  Enable **Developer mode** using the toggle in the top right corner.
5.  Click the **Load unpacked** button in the top left corner.
6.  Select the folder containing the extension files (the root directory of this project).

## How to Use

### Tracking Time
The extension automatically tracks time when you are actively viewing a site that matches your "distracting sites" list.
-   It stops tracking when you switch tabs, minimize the window, or lock your screen.
-   Time is saved in minutes.

### Viewing Stats
-   Click the extension icon in the toolbar to open the popup.
-   The popup shows a progress bar for your daily limit and a list of time spent per site.

### Settings
-   Click the **Settings** button in the popup to open the options page.
-   Here you can:
    -   Change your daily limit (in minutes).
    -   Add new sites to track.
    -   Remove sites from the list.
    -   View and add recommended sites based on your browsing frequency.
    -   Enable or disable notifications.

## Development

This is a Manifest V3 Chrome extension.

### File Structure
-   `manifest.json`: Extension configuration.
-   `background.js`: Service worker that handles time tracking and notifications.
-   `popup/`: Files for the extension popup (HTML, CSS, JS).
-   `options.html`/`options.js`/`options.css`: Files for the settings page.
-   `content.js`: Content script (currently minimal).
