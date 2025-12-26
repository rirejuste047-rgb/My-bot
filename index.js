import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, DisconnectReason, downloadMediaMessage } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import P from 'pino';
import moment from 'moment';
import NodeCache from 'node-cache';

// Import handler
import { handleCommand, setOwnerOnConnect } from './handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
    printQR: true,
    browser: Browsers.ubuntu('Chrome'),
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    logger: P({ level: 'silent' }),
    auth: {
        creds: null,
        keys: null
    }
};

// Message cache to prevent spam
const msgCache = new NodeCache({ stdTTL: 2, checkperiod: 120 });

// ASCII Art Banner
console.clear();
console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║  ██████╗  ██████╗ ███████╗██╗   ██╗██████╗  ██████╗  ║
║  ██╔══██╗██╔═══██╗██╔════╝██║   ██║██╔══██╗██╔═══██╗ ║
║  ██║  ██║██║   ██║█████╗  ██║   ██║██████╔╝██║   ██║ ║
║  ██║  ██║██║   ██║██╔══╝  ██║   ██║██╔══██╗██║   ██║ ║
║  ██████╔╝╚██████╔╝██║     ╚██████╔╝██║  ██║╚██████╔╝ ║
║  ╚═════╝  ╚═════╝ ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ║
║                                                       ║
║                  WhatsApp Bot v2.0                    ║
║              Created by: オビト・デヴ卿               ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`));

// Utility functions
function colorLog(type, message) {
    const timestamp = chalk.gray(`[${moment().format('HH:mm:ss')}]`);
    const colors = {
        info: chalk.cyan,
        success: chalk.green,
        warning: chalk.yellow,
        error: chalk.red,
        event: chalk.magenta,
        system: chalk.blue
    };
    
    console.log(`${timestamp} ${colors[type](`[${type.toUpperCase()}]`)} ${message}`);
}

async function connectToWhatsApp() {
    colorLog('system', 'Initializing bot...');
    
    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    colorLog('info', `Using WA v${version.join('.')}, latest: ${isLatest}`);
    
    const sock = makeWASocket({
        version,
        logger: CONFIG.logger,
        printQRInTerminal: false,
        browser: CONFIG.browser,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: "fatal" }))
        },
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        getMessage: async (key) => {
            return null;
        }
    });
    
    // QR Code handler
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr && CONFIG.printQR) {
            colorLog('system', 'Scan this QR code with WhatsApp:');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            colorLog('warning', `Connection closed due to ${lastDisconnect.error?.message || 'unknown reason'}, reconnecting: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                setTimeout(connectToWhatsApp, 5000);
            } else {
                colorLog('error', 'Logged out, please delete auth folder and restart');
            }
        } else if (connection === 'open') {
            colorLog('success', '✅ Bot connected successfully!');
            
            // Set owner
            await setOwnerOnConnect(sock);
            
            // Set profile status
            try {
                await sock.updateProfileStatus('🤖 DofuBot is Online | .menu for commands');
                colorLog('info', 'Profile status updated');
            } catch (err) {
                colorLog('warning', 'Could not update profile status');
            }
            
            // Send startup message to owner
            setTimeout(async () => {
                try {
                    const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
                    if (config.owner) {
                        await sock.sendMessage(`${config.owner}@s.whatsapp.net`, {
                            text: `🤖 *DofuBot Started Successfully!*\n\n*Time:* ${moment().format('YYYY-MM-DD HH:mm:ss')}\n*Version:* 2.0.0\n*Mode:* ${config.mode}\n\nType .menu for commands`
                        });
                    }
                } catch (err) {
                    colorLog('warning', 'Could not send startup message to owner');
                }
            }, 3000);
        }
    });
    
    // Save credentials
    sock.ev.on('creds.update', saveCreds);
    
    // Message handler
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        const message = messages[0];
        if (!message.message) return;
        
        // Ignore old messages
        if (message.messageTimestamp && (Date.now() - message.messageTimestamp * 1000) > 30000) {
            return;
        }
        
        // Anti-spam protection
        const msgKey = `${message.key.remoteJid}-${message.key.id}`;
        if (msgCache.has(msgKey)) {
            colorLog('warning', `Duplicate message detected: ${msgKey}`);
            return;
        }
        msgCache.set(msgKey, true);
        
        // Handle command
        try {
            await handleCommand(message, sock);
        } catch (err) {
            colorLog('error', `Error processing message: ${err.message}`);
            console.error(err);
        }
    });
    
    // Presence updates
    sock.ev.on('presence.update', async (update) => {
        // Optional: Handle presence updates
    });
    
    // Connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, receivedPendingNotifications } = update;
        
        if (receivedPendingNotifications) {
            colorLog('info', 'Received pending notifications');
        }
    });
    
    // Handle group updates
    sock.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action } = update;
            
            const actions = {
                'add': 'joined',
                'remove': 'left',
                'promote': 'was promoted to admin',
                'demote': 'was demoted from admin'
            };
            
            if (action in actions) {
                colorLog('event', `Group ${id}: ${participants[0].split('@')[0]} ${actions[action]}`);
                
                // Optional: Send welcome message for new members
                if (action === 'add') {
                    const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
                    if (config.welcomeEnabled) {
                        await sock.sendMessage(id, {
                            text: `👋 Welcome @${participants[0].split('@')[0]} to the group!\n\nType .menu to see available commands`
                        });
                    }
                }
            }
        } catch (err) {
            colorLog('error', `Error handling group update: ${err.message}`);
        }
    });
    
    // Handle messages being deleted
    sock.ev.on('messages.delete', async (item) => {
        if (item.keys) {
            colorLog('event', `Messages deleted in ${item.keys[0].remoteJid}`);
        }
    });
    
    // Error handling
    sock.ev.on('messages.update', (updates) => {
        for (const update of updates) {
            if (update.update?.status) {
                colorLog('info', `Message ${update.key.id} status: ${update.update.status}`);
            }
        }
    });
    
    // Handle call updates
    sock.ev.on('call', (call) => {
        colorLog('event', `Incoming call from ${call.from}`);
    });
    
    // Periodic tasks
    setInterval(() => {
        // Clean old cache entries
        const stats = msgCache.getStats();
        if (stats.keys > 1000) {
            msgCache.flushAll();
            colorLog('info', 'Message cache cleared');
        }
    }, 60000); // Every minute
    
    return sock;
}

// Auto-restart on crash
process.on('unhandledRejection', (reason, promise) => {
    colorLog('error', `Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
    colorLog('error', `Uncaught Exception: ${error.message}`);
    console.error(error.stack);
    
    // Attempt to restart after 5 seconds
    setTimeout(() => {
        colorLog('system', 'Attempting to restart bot...');
        connectToWhatsApp().catch(err => {
            colorLog('error', `Failed to restart: ${err.message}`);
            process.exit(1);
        });
    }, 5000);
});

// Graceful shutdown
process.on('SIGINT', () => {
    colorLog('system', 'Shutting down bot gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    colorLog('system', 'Received SIGTERM, shutting down...');
    process.exit(0);
});

// Main function
async function main() {
    try {
        // Check for auth folder
        if (!fs.existsSync('./auth')) {
            fs.mkdirSync('./auth', { recursive: true });
            colorLog('info', 'Created auth directory');
        }
        
        // Check for config files
        if (!fs.existsSync('./config.json')) {
            const defaultConfig = {
                owner: "",
                creator: "2250712668494",
                mode: "public",
                welcomeEnabled: true,
                antiSpam: true,
                maxFileSize: 100, // MB
                allowedMediaTypes: ["image", "video", "audio", "document"]
            };
            fs.writeFileSync('./config.json', JSON.stringify(defaultConfig, null, 2));
            colorLog('info', 'Created default config.json');
        }
        
        // Check for commands folder
        if (!fs.existsSync('./commands')) {
            fs.mkdirSync('./commands', { recursive: true });
            colorLog('info', 'Created commands directory');
            
            // Create example command
            const exampleCommand = `export default async function exampleCommand(message, client, { sender, args }) {
    await client.sendMessage(message.key.remoteJid, {
        text: \`👋 Hello \${sender}! This is an example command.\nYour message: \${args.join(' ') || 'No args provided'}\`
    });
}`;
            
            fs.writeFileSync('./commands/example.js', exampleCommand);
            colorLog('info', 'Created example command');
        }
        
        // Start bot
        colorLog('system', 'Starting DofuBot v2.0...');
        await connectToWhatsApp();
        
    } catch (error) {
        colorLog('error', `Failed to start bot: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run bot
main().catch(console.error);

// Export for testing
export { connectToWhatsApp };
