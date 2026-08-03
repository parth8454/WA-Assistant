import express from 'express';
import cors from 'cors';
import { restoreSession } from './whatsapp.js';
import { handleIncomingMessage } from './webhook.js';
import 'dotenv/config';

const app = express();
const PORT = 3000;

app.use(cors());

app.use(express.json()); 

let browserClients = [];
let latestQR = null;
let isLinked = false;

app.get('/qr-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    browserClients.push(res);

    if (isLinked) {
        res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`);
    } else if (latestQR) {
        res.write(`data: ${JSON.stringify({ qr: latestQR })}\n\n`);
    }

    req.on('close', () => {
        browserClients = browserClients.filter(client => client !== res);
    });
});

const sendToBrowser = (data) => {
    browserClients.forEach(client => client.write(`data: ${JSON.stringify(data)}\n\n`));
};

restoreSession(
    // 1. Message Event
    (customerPhone, text) => {
        handleIncomingMessage(customerPhone, text);
    },
    // 2. QR Code Event
    (qrDataURL) => {
        latestQR = qrDataURL;
        isLinked = false;
        console.log('📱 Sending QR to browser...');
        sendToBrowser({ qr: qrDataURL });
        console.log('QR sent to browser');
    },
    // 3. Connected Event
    () => {
        isLinked = true;
        latestQR = null;
        console.log('✅ Connected! Telling browser to close QR...');
        sendToBrowser({ status: 'connected' });
    }
);

app.get('/',(req,res)=>{
    res.status(200).send("Assistant is LIVE")
});

app.listen(PORT,()=>{
    console.log(`Assistant running on http://localhost:${PORT}`);
});