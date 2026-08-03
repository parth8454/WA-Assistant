import {Groq} from "groq-sdk";
import {sendMessage} from "./whatsapp.js";
import NodeCache from "node-cache";

const conversationHistory = new NodeCache({ stdTTL: 1800, checkperiod: 120 });

const systemPrompt = `
here you can add details about yourself and tell the agent what to say and how to deal with people.
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
