const config = require('../config');

/**
 * Handles Google account authentication
 */
class GoogleAuth {
    constructor(page) {
        this.page = page;
        this.config = config;
    }

    /**
     * Check if user is already logged in
     */
    async isLoggedIn() {
        try {
            // Navigate to Flow and check for sign-in indicators
            await this.page.goto(this.config.urls.flowCreate, { waitUntil: 'networkidle' });

            // Wait a bit for the page to fully load
            await this.page.waitForTimeout(3000);

            // Check for user avatar or account menu (indicates logged in)
            const userMenu = await this.page.$('img[alt*="avatar"], img[alt*="profile"], [aria-label*="Account"], [aria-label*="Tài khoản"]');
            if (userMenu) {
                console.log('✅ Already logged in to Google account');
                return true;
            }

            // Check for sign-in button (indicates not logged in)
            const signInBtn = await this.page.$(this.config.selectors.signInButton);
            if (signInBtn) {
                console.log('❌ Not logged in - Sign in button found');
                return false;
            }

            // If neither found, assume logged in
            return true;
        } catch (error) {
            console.log('⚠️ Error checking login status:', error.message);
            return false;
        }
    }

    /**
     * Perform Google login
     */
    async login() {
        const { email, password } = this.config.google;

        if (!email || !password) {
            throw new Error('Google credentials not configured. Please set GOOGLE_EMAIL and GOOGLE_PASSWORD in .env file');
        }

        console.log('🔐 Starting Google login process...');

        try {
            // Look for and click sign-in button
            const signInBtn = await this.page.$(this.config.selectors.signInButton);
            if (signInBtn) {
                await signInBtn.click();
                await this.page.waitForTimeout(2000);
            }

            // Wait for Google login page
            await this.page.waitForSelector(this.config.selectors.googleEmailInput, { timeout: 30000 });

            // Enter email
            console.log('📧 Entering email...');
            await this.page.fill(this.config.selectors.googleEmailInput, email);
            await this.page.click(this.config.selectors.googleNextButton);
            await this.page.waitForTimeout(3000);

            // Wait for password field
            await this.page.waitForSelector(this.config.selectors.googlePasswordInput, { timeout: 30000 });

            // Enter password
            console.log('🔑 Entering password...');
            await this.page.fill(this.config.selectors.googlePasswordInput, password);
            await this.page.click(this.config.selectors.googlePasswordNext);

            // Wait for login to complete
            await this.page.waitForTimeout(5000);

            // Check for 2FA or security challenges
            const twoFactorIndicators = await this.page.$('input[type="tel"], [aria-label*="code"], [aria-label*="mã"]');
            if (twoFactorIndicators) {
                console.log('⚠️ Two-factor authentication required!');
                console.log('🔔 Please complete 2FA manually in the browser window...');

                // Wait for user to complete 2FA (max 2 minutes)
                await this.page.waitForNavigation({ timeout: 120000 });
            }

            // Verify login success
            await this.page.waitForTimeout(3000);
            console.log('✅ Login completed!');
            return true;

        } catch (error) {
            console.error('❌ Login failed:', error.message);
            throw error;
        }
    }

    /**
     * Ensure user is logged in (login if needed)
     */
    async ensureLoggedIn() {
        const loggedIn = await this.isLoggedIn();
        if (!loggedIn) {
            await this.login();
        }
        return true;
    }
}

module.exports = GoogleAuth;
