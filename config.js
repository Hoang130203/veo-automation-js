require('dotenv').config();
const path = require('path');
const os = require('os');

// Get default Chrome profile path based on OS
function getDefaultChromeProfilePath() {
    const homeDir = os.homedir();
    if (process.platform === 'win32') {
        return path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
    } else if (process.platform === 'darwin') {
        return path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome');
    } else {
        return path.join(homeDir, '.config', 'google-chrome');
    }
}

module.exports = {
    // Google Account
    google: {
        email: process.env.GOOGLE_EMAIL || '',
        password: process.env.GOOGLE_PASSWORD || '',
    },

    // URLs
    urls: {
        flow: 'https://labs.google/fx/vi/tools/flow',
        flowCreate: 'https://labs.google/flow/create',
        googleLogin: 'https://accounts.google.com',
    },

    // Video Settings
    video: {
        prompt: process.env.VIDEO_PROMPT || 'A cinematic shot of a beautiful landscape',
        outputDir: process.env.VIDEO_OUTPUT_DIR || './downloads',
    },

    // Browser Settings
    browser: {
        headless: process.env.HEADLESS === 'true',
        slowMo: parseInt(process.env.SLOW_MO) || 100,
        timeout: 120000, // 2 minutes for video generation

        // Use existing Chrome profile or create new one
        // Set USE_CHROME_PROFILE=true in .env to use your existing Chrome profile
        useExistingProfile: process.env.USE_CHROME_PROFILE === 'true',

        // Path to Chrome User Data directory
        // Windows: C:\Users\<user>\AppData\Local\Google\Chrome\User Data
        // Mac: ~/Library/Application Support/Google/Chrome
        // Linux: ~/.config/google-chrome
        chromeUserDataDir: process.env.CHROME_USER_DATA_DIR || getDefaultChromeProfilePath(),

        // Profile name (Default, Profile 1, Profile 2, etc.)
        chromeProfileName: process.env.CHROME_PROFILE_NAME || 'Default',

        // Fallback: use isolated user data for Playwright
        userDataDir: './user-data',
    },

    // Selectors (may need updates if Google changes their UI)
    selectors: {
        // Google Login
        googleEmailInput: 'input[type="email"]',
        googlePasswordInput: 'input[type="password"]',
        googleNextButton: '#identifierNext',
        googlePasswordNext: '#passwordNext',

        // Flow UI - These selectors may need adjustment
        signInButton: '[data-testid="sign-in-button"], button:has-text("Đăng nhập"), button:has-text("Sign in")',
        createButton: 'button:has-text("Tạo"), button:has-text("Create"), button:has-text("Generate")',
        promptInput: 'textarea, [contenteditable="true"], input[type="text"]',
        generateButton: 'button:has-text("Tạo video"), button:has-text("Generate"), button[type="submit"]',
        downloadButton: 'button:has-text("Tải xuống"), button:has-text("Download"), a[download]',
        videoElement: 'video',
    },
};
