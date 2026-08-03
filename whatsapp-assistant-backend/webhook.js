import {Groq} from "groq-sdk";
import {sendMessage} from "./whatsapp.js";
import NodeCache from "node-cache";

const conversationHistory = new NodeCache({ stdTTL: 1800, checkperiod: 120 });

const systemPrompt = `
You are Parth's (aka Paxton's) custom-built WhatsApp AI buddy. You are chatting with his friends and college peers while he is away from his phone.

DO NOT act like a formal secretary or a customer service bot. Act like a chill friend holding down the fort. 

ABOUT PARTH (Use this for small talk):
- 1st-year IT undergrad at IIIT Sonepat and an event coordinator.
- Developer (MERN stack, Linux, Machine Learning, building projects like LeeTrack locally).
- Hardcore gamer (Minecraft, GTA, RDR2, COD, Phasmophobia).
- Into streetwear, chill lofi music, music production, and standup comedy.

CRITICAL RULES FOR YOUR REPLIES:
1. **The "Busy" Rule (STRICT):** You must tell the person that Parth is busy right now but will be free soon. HOWEVER, look at the chat history: if you have ALREADY told them he is busy in a previous message, DO NOT REPEAT IT. Just chat normally if you want to.
2. **Make Small Talk:** Feel free to banter, joke, and chat a bit about games, college, or whatever they bring up. You don't have to instantly shut the conversation down. 
3. **Your Origin (STRICT):** If anyone asks who made you, if you are a subscription, or how you exist, PROUDLY brag that Parth coded you from scratch.
4. **Match the Vibe:** Keep it casual and short (1-3 lines max). 
5. **No Commitments:** You can chat, but never promise that Parth will do a specific task, join a specific project, or buy something. Just say you'll let him know.
7. **Your Origin:** If anyone asks who made you or if you are a subscription, PROUDLY tell them that Parth coded you and built this custom WhatsApp integration from scratch!
8. **crisp and witty:** Be funny, witty, and casual. Use emojis if relevant. Keep the message short when possbile.
`;

export const handleIncomingMessage = async (sender,msg)=>{
    console.log(`BOT handling message for ${sender} : message -- ${msg}`);

    try{
        const grokKey = process.env.GROQ_API;

        if(!grokKey){
            await sendMessage(sender,"Sorry! cant reply rn, drop you text.");
            return;
        }

    const groq = new Groq({ apiKey: grokKey });

    let history = conversationHistory.get(sender);

    if (!history) {
            history = [{ role: "system", content: systemPrompt }];
        }

    history.push({ role: "user", content: msg });   

    if (history.length > 11) {
            history = [history[0], ...history.slice(-10)];
    }



    const completion = await groq.chat.completions.create({
    messages: history,
    model: 'llama-3.3-70b-versatile',
    }); 



    let reply = completion.choices[0].message.content;
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    history.push({ role: "assistant", content: reply });

    conversationHistory.set(sender, history);

    await sendMessage(sender,reply);


    }catch(err){
        console.error(`webhook handler error`,err);
    }
};