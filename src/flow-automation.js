const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const config = require('../config');
const GoogleAuth = require('./auth');
const VideoGenerator = require('./video-generator');

/**
 * Main automation class for Google Flow
 */
class FlowAutomation {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.auth = null;
        this.generator = null;
        this.chromeProcess = null;
    }

    /**
     * Initialize browser and pages
     */
    async init() {
        console.log('🌐 Initializing browser...');

        if (config.browser.useExistingProfile) {
            await this.initWithChromeProfile();
        } else {
            await this.initWithPlaywright();
        }

        // Set extra headers to appear more human-like
        await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        });

        // Initialize modules
        this.auth = new GoogleAuth(this.page);
        this.generator = new VideoGenerator(this.page);

        console.log('✅ Browser initialized');
    }

    /**
     * Initialize using existing Chrome profile
     * Opens Chrome with your profile and navigates to Flow
     */
    async initWithChromeProfile() {
        console.log('🔗 Opening Chrome with your profile...');
        console.log(`📂 Profile path: ${config.browser.chromeUserDataDir}`);
        console.log(`👤 Profile name: ${config.browser.chromeProfileName}`);

        // Find Chrome executable
        const chromePaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        ];

        let chromePath = null;
        for (const p of chromePaths) {
            try {
                if (fs.existsSync(p)) {
                    chromePath = p;
                    break;
                }
            } catch (e) { }
        }

        if (!chromePath) {
            throw new Error('Chrome executable not found. Please install Google Chrome.');
        }

        console.log(`🌐 Chrome path: ${chromePath}`);

        // Just open Chrome with the Flow URL - simple and reliable!
        const flowUrl = config.urls.flow;
        const chromeCmd = `"${chromePath}" --profile-directory="${config.browser.chromeProfileName}" --start-maximized "${flowUrl}"`;

        console.log('🚀 Opening Chrome with Flow...');

        const { exec } = require('child_process');
        exec(chromeCmd);

        // Wait for Chrome to open
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('✅ Chrome opened successfully!');
        console.log('📌 Chrome đang chạy độc lập - bạn có thể thao tác thủ công.');

        // Set page to null since we can't control Chrome directly
        // For automation, switch to USE_CHROME_PROFILE=false
        this.page = null;
        this.browser = null;
    }

    /**
     * Check if Chrome is running
     */
    async isChromeRunning() {
        try {
            const { execSync } = require('child_process');
            const result = execSync('tasklist /FI "IMAGENAME eq chrome.exe" /NH', { encoding: 'utf8' });
            return result.toLowerCase().includes('chrome.exe');
        } catch (e) {
            return false;
        }
    }

    /**
     * Wait for Chrome debug port to be available
     */
    async waitForChromeDebugPort(port, timeout) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const response = await fetch(`http://127.0.0.1:${port}/json/version`);
                if (response.ok) {
                    return true;
                }
            } catch (e) {
                // Not ready yet
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        throw new Error(`Chrome debug port ${port} not available after ${timeout}ms`);
    }

    /**
     * Initialize with Playwright's own browser (isolated profile)
     */
    async initWithPlaywright() {
        console.log('🎭 Using Playwright browser with isolated profile...');

        // Launch browser with persistent context to save login
        this.browser = await chromium.launchPersistentContext(
            config.browser.userDataDir,
            {
                headless: config.browser.headless,
                slowMo: config.browser.slowMo,
                viewport: { width: 1920, height: 1080 },
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--window-size=1920,1080',
                ],
                ignoreDefaultArgs: ['--enable-automation'],
            }
        );

        this.page = await this.browser.newPage();
    }

    /**
     * Run full automation: Login -> Generate -> Download
     */
    async run(options = {}) {
        const {
            prompt = config.video.prompt,
            filename = null,
            skipLogin = false,
        } = options;

        try {
            await this.init();

            // Ensure user is logged in
            if (!skipLogin) {
                await this.auth.ensureLoggedIn();
            }

            // Generate and download video
            const filePath = await this.generator.generateAndDownload(prompt, filename);

            console.log('🎉 Automation completed successfully!');
            console.log(`📁 Video saved to: ${filePath}`);

            return filePath;

        } catch (error) {
            console.error('❌ Automation error:', error.message);
            throw error;
        }
    }

    /**
     * Interactive mode: Keep browser open for manual interaction
     */
    async interactive(skipLogin = true) {
        try {
            await this.init();

            // Skip login if already logged in (session saved)
            if (!skipLogin) {
                await this.auth.ensureLoggedIn();
            }

            // Go directly to Flow page
            console.log('🚀 Navigating to Google Flow...');
            await this.page.goto(config.urls.flow, { waitUntil: 'networkidle' });
            await this.page.waitForTimeout(3000);

            // Try to click the button with specified class
            console.log('🔍 Looking for the button...');
            const buttonSelector = '.sc-c177465c-1.hVamcH.sc-a38764c7-0.fXsrxE';

            try {
                await this.page.waitForSelector(buttonSelector, { timeout: 10000 });
                console.log('✅ Found button! Clicking...');
                await this.page.click(buttonSelector);
                console.log('🎯 Button clicked!');
                await this.page.waitForTimeout(2000);
            } catch (e) {
                console.log('⚠️ Button not found with exact class. Trying alternatives...');

                // Try alternative selectors
                const alternatives = [
                    'button.sc-c177465c-1',
                    '[class*="sc-c177465c-1"]',
                    'button:has-text("Tạo")',
                    'button:has-text("Create")',
                ];

                for (const sel of alternatives) {
                    try {
                        const btn = await this.page.$(sel);
                        if (btn) {
                            console.log(`✅ Found with selector: ${sel}`);
                            await btn.click();
                            console.log('🎯 Button clicked!');
                            break;
                        }
                    } catch (e2) { }
                }
            }

            console.log('🎮 Interactive mode - Browser is open for manual use');
            console.log('💡 You can now interact with the browser manually');
            console.log('⏹️ Press Ctrl+C to exit');

            // Keep the script running
            await new Promise(() => { });

        } catch (error) {
            console.error('❌ Error:', error.message);
            throw error;
        }
    }

    /**
     * Close browser and cleanup
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Browser closed');
        }
    }
}

module.exports = FlowAutomation;
