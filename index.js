require('dotenv').config();
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;
const sessionName = process.env.SESSION_SECRET;


const client = new Client({
    authStrategy: new LocalAuth({
        clientId: sessionName,
        dataPath: './data/',
    }),
    restartOnAuthFail: true,
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', qr => {
    console.log('No session found Locally. Please scan QR code to login.');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', async () => {
    console.log('Authenticated');
});

client.initialize();

app.use(express.json());

// Middleware to check API key
app.use((req, res, next) => {
    const requestApiKey = req.headers['x-api-key'];
    if (requestApiKey && requestApiKey === apiKey) {
        next();
    } else {
        res.status(403).send('Forbidden: Invalid API Key');
    }
});

app.post('/send-message', async (req, res) => {
    const { groupId, message } = req.body;

    try {
        const chat = await client.getChatById(groupId);
        await chat.sendMessage(message);
        res.status(200).send('Message sent successfully');
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send('Failed to send message');
    }
});

app.get('/get-chats', async (req, res) => {
    try {
        const chats = await client.getChats();

        const groupChats = chats.filter(chat => chat.isGroup);

        res.status(200).send(groupChats);
    } catch (error) {
        console.error('Error getting chats:', error);
        res.status(500).send('Failed to get chats');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

