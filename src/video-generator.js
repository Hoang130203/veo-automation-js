const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Handles video generation and download from Google Flow
 */
class VideoGenerator {
    constructor(page) {
        this.page = page;
        this.config = config;
    }

    /**
     * Navigate to Flow create page
     */
    async navigateToCreate() {
        console.log('🚀 Navigating to Google Flow...');
        await this.page.goto(this.config.urls.flowCreate, { waitUntil: 'networkidle' });
        await this.page.waitForTimeout(3000);
        console.log('✅ Loaded Flow create page');
    }

    /**
     * Enter prompt for video generation
     */
    async enterPrompt(prompt) {
        console.log('✍️ Entering video prompt...');

        // Try different selectors for the prompt input
        const promptSelectors = [
            'textarea[placeholder*="prompt"]',
            'textarea[placeholder*="Prompt"]',
            'textarea[placeholder*="mô tả"]',
            'textarea[placeholder*="Mô tả"]',
            'textarea',
            '[contenteditable="true"]',
            'input[type="text"][placeholder*="prompt"]',
        ];

        let promptInput = null;
        for (const selector of promptSelectors) {
            promptInput = await this.page.$(selector);
            if (promptInput) {
                console.log(`📝 Found prompt input with selector: ${selector}`);
                break;
            }
        }

        if (!promptInput) {
            throw new Error('Could not find prompt input field');
        }

        await promptInput.click();
        await this.page.waitForTimeout(500);
        await promptInput.fill(prompt);
        console.log(`✅ Prompt entered: "${prompt.substring(0, 50)}..."`);
    }

    /**
     * Click generate button to start video creation
     */
    async clickGenerate() {
        console.log('🎬 Starting video generation...');

        // Try different selectors for the generate button
        const generateSelectors = [
            'button:has-text("Generate")',
            'button:has-text("Tạo")',
            'button:has-text("Create")',
            'button[type="submit"]',
            'button:has-text("Tạo video")',
            '[data-testid="generate-button"]',
        ];

        let generateBtn = null;
        for (const selector of generateSelectors) {
            generateBtn = await this.page.$(selector);
            if (generateBtn) {
                const isVisible = await generateBtn.isVisible();
                const isEnabled = await generateBtn.isEnabled();
                if (isVisible && isEnabled) {
                    console.log(`🔘 Found generate button with selector: ${selector}`);
                    break;
                }
            }
            generateBtn = null;
        }

        if (!generateBtn) {
            throw new Error('Could not find generate button');
        }

        await generateBtn.click();
        console.log('✅ Generation started!');
    }

    /**
     * Wait for video to be generated
     */
    async waitForVideoGeneration() {
        console.log('⏳ Waiting for video generation (this may take a few minutes)...');

        // Wait for video element or download button to appear
        const maxWaitTime = 300000; // 5 minutes
        const checkInterval = 5000; // Check every 5 seconds
        let elapsed = 0;

        while (elapsed < maxWaitTime) {
            // Check for video element
            const video = await this.page.$('video[src], video source[src]');
            if (video) {
                console.log('🎥 Video element found!');
                return true;
            }

            // Check for download button
            const downloadBtn = await this.page.$('button:has-text("Download"), button:has-text("Tải xuống"), a[download]');
            if (downloadBtn) {
                const isVisible = await downloadBtn.isVisible();
                if (isVisible) {
                    console.log('⬇️ Download button found!');
                    return true;
                }
            }

            // Check for error messages
            const errorMsg = await this.page.$('[class*="error"], [role="alert"]:has-text("error")');
            if (errorMsg) {
                const errorText = await errorMsg.textContent();
                throw new Error(`Video generation failed: ${errorText}`);
            }

            // Log progress
            const progressBar = await this.page.$('[role="progressbar"], [class*="progress"]');
            if (progressBar) {
                const progressValue = await progressBar.getAttribute('aria-valuenow');
                if (progressValue) {
                    console.log(`📊 Generation progress: ${progressValue}%`);
                }
            }

            await this.page.waitForTimeout(checkInterval);
            elapsed += checkInterval;
            console.log(`⏱️ Waiting... (${elapsed / 1000}s / ${maxWaitTime / 1000}s)`);
        }

        throw new Error('Video generation timeout - exceeded 5 minutes');
    }

    /**
     * Download the generated video
     */
    async downloadVideo(customFilename = null) {
        console.log('⬇️ Starting video download...');

        // Ensure output directory exists
        const outputDir = path.resolve(this.config.video.outputDir);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Set up download handling
        const [download] = await Promise.all([
            this.page.waitForEvent('download', { timeout: 60000 }),
            this._clickDownloadButton(),
        ]);

        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const suggestedFilename = download.suggestedFilename() || `flow-video-${timestamp}.mp4`;
        const filename = customFilename || suggestedFilename;
        const filePath = path.join(outputDir, filename);

        // Save the file
        await download.saveAs(filePath);
        console.log(`✅ Video downloaded: ${filePath}`);

        return filePath;
    }

    /**
     * Helper to click download button
     */
    async _clickDownloadButton() {
        const downloadSelectors = [
            'button:has-text("Download")',
            'button:has-text("Tải xuống")',
            'a[download]',
            '[data-testid="download-button"]',
            'button[aria-label*="download"]',
            'button[aria-label*="tải"]',
        ];

        for (const selector of downloadSelectors) {
            const btn = await this.page.$(selector);
            if (btn) {
                const isVisible = await btn.isVisible();
                if (isVisible) {
                    await btn.click();
                    console.log(`🔘 Clicked download button: ${selector}`);
                    return;
                }
            }
        }

        // Try right-click on video to download
        const video = await this.page.$('video');
        if (video) {
            console.log('🔧 Trying to download via video context menu...');
            await video.click({ button: 'right' });
            await this.page.waitForTimeout(500);

            // Try to click "Save video as" or similar
            const saveOption = await this.page.$('text="Save video as"');
            if (saveOption) {
                await saveOption.click();
                return;
            }
        }

        throw new Error('Could not find download button');
    }

    /**
     * Main function: Generate and download video
     */
    async generateAndDownload(prompt = null, filename = null) {
        const videoPrompt = prompt || this.config.video.prompt;

        await this.navigateToCreate();
        await this.enterPrompt(videoPrompt);
        await this.clickGenerate();
        await this.waitForVideoGeneration();
        const filePath = await this.downloadVideo(filename);

        return filePath;
    }
}

module.exports = VideoGenerator;
