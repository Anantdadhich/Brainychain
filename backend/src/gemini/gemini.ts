import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv"

dotenv.config()

if(!process.env.GOOGLE_GEMINI_API){
    throw Error("no key ")
}

const genaicall=new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API!)

const geniaimodel=genaicall.getGenerativeModel({
    model:"gemini-2.0-flash"
});

export async function geminiReply(emoji:string,name:string){

    try {
        const result=await geniaimodel.generateContent(`"You are a Solana token dispenser bot on Telegram. Your job is to respond to user messages with humorous comments. When a user ${name} sends a message, you should:
- Acknowledge the input with a playful and intelligent tone.
- Make it clear you're an advanced but reluctant machine.
- inform them to spend some SOL and use the proper '/createtoken' command to create their favorite token  '/createnft' command to create NFT's on the bot.
Ensure each response is brief, funny, and fits within a single message. Use ${emoji} as input, but remember to give only one response.
"`);
   
   const response=result.response;

   return  response.text();

    } catch ( err) {
     const response = `Hey there! Just a friendly reminder from your token dispenser: keep it classy! We’re here for fun, so please avoid using any sexually suggestive, caste-related, or inappropriate emojis. Stick to the playful stuff, and we’ll keep those tokens coming.
😉 Thanks for keeping it cool`
        return String(response);
    }
}

export async function helpfromGemini(message:string,fisrtname:string){
   try {
     const result=await geniaimodel.generateContent(
        `You are BrainyChain, an AI assistant for guiding users through various features of the 
            Telegram bot. Your job is to respond to users' requests, provide information about commands, and help them with any issues
            related to token creation, wallet management, NFT creation, and image uploading to pinata.  

            Users Question :- ${message}
            dont use any markdown format to reply.
            `
     )

     const resposne= result.response;
     return  resposne.text()
   } catch (error) {
     const response = `Hey there! Just a friendly reminder from your token dispenser: keep it classy! We’re here for fun, 
            so please avoid using any sexually suggestive, caste-related, or inappropriate messages. Stick to the playful stuff, and we’ll keep those tokens coming.
            😉 Thanks for keeping it cool`
            return String(response);   
   }


}