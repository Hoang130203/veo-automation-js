#!/usr/bin/env node

const FlowAutomation = require('./src/flow-automation');

/**
 * Google Flow Video Automation Tool
 * 
 * Usage:
 *   node index.js                    - Run with default prompt from .env
 *   node index.js --prompt "..."     - Run with custom prompt
 *   node index.js --interactive      - Open browser for manual use
 *   node index.js --help             - Show help
 */

async function main() {
    const args = process.argv.slice(2);
    const automation = new FlowAutomation();

    // Parse arguments
    const isInteractive = args.includes('--interactive') || args.includes('-i');
    const isHelp = args.includes('--help') || args.includes('-h');

    let prompt = null;
    let filename = null;

    // Parse --prompt argument
    const promptIndex = args.findIndex(a => a === '--prompt' || a === '-p');
    if (promptIndex !== -1 && args[promptIndex + 1]) {
        prompt = args[promptIndex + 1];
    }

    // Parse --output argument
    const outputIndex = args.findIndex(a => a === '--output' || a === '-o');
    if (outputIndex !== -1 && args[outputIndex + 1]) {
        filename = args[outputIndex + 1];
    }

    // Show help
    if (isHelp) {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🎬 Google Flow Video Automation Tool 🎬              ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  USAGE:                                                        ║
║    node index.js [options]                                     ║
║                                                                ║
║  OPTIONS:                                                      ║
║    -p, --prompt <text>   Custom prompt for video generation    ║
║    -o, --output <file>   Custom output filename                ║
║    -i, --interactive     Open browser for manual interaction   ║
║    -h, --help            Show this help message                ║
║                                                                ║
║  EXAMPLES:                                                     ║
║    node index.js                                               ║
║    node index.js --prompt "A cat playing piano"                ║
║    node index.js --prompt "Sunset" --output sunset.mp4         ║
║    node index.js --interactive                                 ║
║                                                                ║
║  SETUP:                                                        ║
║    1. Copy .env.example to .env                                ║
║    2. Add your Google credentials to .env                      ║
║    3. Run the tool                                             ║
║                                                                ║
║  NOTE:                                                         ║
║    - First run requires Google login                           ║
║    - 2FA will prompt for manual input                          ║
║    - Session is saved for subsequent runs                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        `);
        return;
    }

    try {
        if (isInteractive) {
            console.log('🎮 Starting interactive mode...');
            await automation.interactive();
        } else {
            console.log('🚀 Starting video generation automation...');
            if (prompt) {
                console.log(`📝 Using custom prompt: "${prompt}"`);
            }
            await automation.run({ prompt, filename });
        }
    } catch (error) {
        console.error('💥 Fatal error:', error.message);
        process.exit(1);
    } finally {
        await automation.close();
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏹️ Shutting down...');
    process.exit(0);
});

process.on('unhandledRejection', (error) => {
    console.error('💥 Unhandled rejection:', error);
    process.exit(1);
});

main();
