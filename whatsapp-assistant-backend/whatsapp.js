import makeWASocket,{useMultiFileAuthState,DisconnectReason,fetchLatestBaileysVersion} from "@whiskeysockets/baileys";
import { Boom} from "@hapi/boom";
import qrcode from 'qrcode';
import {fileURLToPath} from 'url';
import fs from 'fs';
import path, {dirname,join} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const SESSIONS_DIR = join(__dirname, '../session');

if(!fs.existsSync(SESSIONS_DIR)){
    fs.mkdirSync(SESSIONS_DIR,{recursive:true});
}

export let sock = null;

let SESSION_HEALTH = 0;

export const startHealthCheck = (onDead)=>{

    setInterval(()=>{
        
        if(!sock){
            return;
        }

        const now = Date.now();
        const lastSeen = SESSION_HEALTH || 0;

        const MSA = (now-lastSeen)/1000/60;

        if(MSA>30){
            console.log(`Session Health check ping for BOT -- reconnecting`);
            sock.sendPresenceUpdate('avaliable').catch(()=>{
                console.log('BOT session dead -- reconnecting');
                sock=null;
                onDead();
            });
        }

        

    },5*60*1000);
}

export const createSession = async(onMessage,onQR,onReady)=>{

    const{state,saveCreds}=await useMultiFileAuthState(SESSIONS_DIR)
    const{version}=await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth:state,
        printQRInTerminal:false,
        logger:(await import('pino')).default({level:'silent'}),
        markOnlineOnConnect:false,
        syncFullHistory:false
    });

    console.log("socket created");

    sock.ev.on('creds.update',saveCreds);

    let isReconnecting = false;

    sock.ev.on('connection.update',async(update)=>{
        const{connection,lastDisconnect,qr} = update;

        if(qr){
            const qrDataURL = await qrcode.toDataURL(qr);
            onQR(qrDataURL);
        }

        if(connection === 'open'){
            console.log('Assistant whatsapp connected');
            if(onReady){
                onReady();
            }
        }

        if(connection === 'close'){
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;

            sock = null;

            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            if(shouldReconnect && !isReconnecting){
                isReconnecting = true;
                setTimeout(() => {
                   isReconnecting = false;  
                   createSession(onMessage,onQR,onReady);
                }, 5000);
            }else if(!shouldReconnect){
                deleteSession();
                console.log("loggedOut Successfully");
            }
        }
    });

    sock.ev.on('messages.upsert',async ({messages})=>{

        SESSION_HEALTH = Date.now();

        const msg = messages[0];

        if(!msg || msg.key.fromMe || !msg.message){
            return;
        }

        const senderPhno = msg.key.remoteJidAlt || msg.key.remoteJid;

        const msgtxt = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        
        if(!msgtxt){
            return;
        }

        console.log(`got an message from ${senderPhno} : ${msgtxt}`);

        onMessage(senderPhno,msgtxt);
    });
    return sock;
};

export const sendMessage = async (to,text,retries = 2)=>{

    if(!sock){

        console.error(`No Active whatsapp Session Found`);
    
        if(retries > 0){
            console.log(`retrying in 2 seconds - ${retries} tries left`);
            await new Promise(r=>setTimeout(r,2000));
            return sendMessage(to,text,retries - 1);
        }
        return;
    }

    if(to.includes('@g.us')){
        return;
    }

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

    try{

        await sock.sendMessage(jid,{text},{});
        console.log(`Message : ${text} -- sent to ${to}`);

    }catch(err){
        if(retries>0 && err.message?.includes('Connection Closed')){
            console.log(`Connection has been closed -- Retrying`);
            await new Promise(r => setTimeout(r,2000));
            return sendMessage(to,text,retries-1);
        }
        throw err;
    }
};

export const restoreSession = async (onMessage,onQR,onReady)=>{
    console.log('restoring session');
    await createSession(
        (sender,text) => onMessage(sender,text),
        onQR,
        onReady,
    );
};

export const deleteSession = async ()=>{
    if(sock){
        await sock.logout();
    }

    const sessionPath = join(__dirname, '../session');
    if (fs.existsSync(sessionPath)){
        fs.rmSync(sessionPath,{recursive:true,force:true});
    }
    console.log(`WhatsApp Disconnected`);
}