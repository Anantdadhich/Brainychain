import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Telegraf } from "telegraf";

import { message } from "telegraf/filters";
import { PrismaClient } from "@prisma/client";
import { addUser } from "../db/function";
import WalletCommands, { hashPassandstore } from "../solmanager/wallet/walletcommnad";
import { geminiReply, helpfromGemini } from "../gemini/gemini";
import tokenCommnads from "../solmanager/token/tokencommands";
import createNFTcommands from "../solmanager/nft/command";
import imageUpload from "../solmanager/imageuploader/commands";





dotenv.config()



if (!process.env.BOT_TOKEN) {
    throw Error("no bot found");
}

const prisma = new PrismaClient();
export const bot = new Telegraf(process.env.BOT_TOKEN);

// Setup webhook if WEBHOOK_URL is provided
if (process.env.WEBHOOK_URL) {
    bot.telegram.setWebhook(process.env.WEBHOOK_URL)
        .then(() => console.log('Webhook set successfully'))
        .catch((error) => console.error('Error setting webhook:', error));
} else {
    console.log('No webhook URL provided, running in polling mode');
}

let prompt=false;
//user start the bot 
const messagestart= `Welcome to BrainyChain! 🌟

🚀 Empower your Web3 journey with BrainyChain:
• 💼 Generate secure wallets instantly
• 🪙 Create custom tokens seamlessly
• 🎨 Mint unique NFTs effortlessly
• 🔒 Store your digital assets forever

Let's get started! 🚀`;

let isbotstarting=false;

export default function botCommands(){
bot.command("start",async(str)=>{
    try {
        if(!str.from?.username){
          str.reply("⚠️ No username found. Please set up your Telegram username in settings before using this bot.");
                return;   
        }

        await addUser(str.from.username);
        bot.telegram.sendMessage(str.chat.id,messagestart)
        str.reply("🔐 To secure your wallet, please create a strong password. This will help protect your assets and keep your account safe!",{reply_markup:{force_reply:true}});
        isbotstarting=true;

        bot.on(message("text"),async(str,next)=>{
        try {
          if(!isbotstarting){
            return  next();
          }

          str.reply("✅ Password set successfully!");
          str.reply("🎯 Get started by using /createwallet command");

         setTimeout(()=>hashPassandstore(str,str.message.text),1000)
         isbotstarting=false;
      } catch (error) {
           console.error("Error in text message handler:", error);
                    str.reply("❌ An error occurred while setting your password. Please try again.");
      }
        })



    } catch (error) {
          console.error("Error in start command:", error);
            str.reply("Something went wrong. Please try again later.");
    }


})


bot.on(message('sticker'),async(str)=>{
    try {
    if(!str.from.username){
        str.reply("no user")
        return
    }

    const user=await prisma.user.findUnique({
        where:{
            name:str.from.username
        }
    })

    if(!user){
        str.reply("no user found.Please use /start ")
        return 
    }

    const messagereply=await geminiReply(str.message.sticker.emoji! ,str.from.first_name);
    str.reply(messagereply,{parse_mode:
        "Markdown"
    });

} catch (error) {
   console.error("Error in sticker handler ",error)    
   str.reply("something went wrong ") 
    }
});

bot.command("askai",async(str)=>{
    try {
 if(!str.from.username){
    str.reply("⚠️ Username not found. Please set up your Telegram username first.");
    return;
 }
 const user=await prisma.user.findUnique({
    where:{
        name:str.from.username
    }
 })

   if(!user){
        str.reply("❌ User not found. Please use /start to begin.")
        return 
    }

    await str.reply("👋 Hey there! I'm BrainyChain, your AI-powered Telegram bot created by adtech 🤖\n\nI can help you with:\n• 💰 Token creation\n• 🎨 NFT minting\n• 🔐 Wallet management\n• 💬 And much more!\n\nJust ask me anything, and I'll be happy to assist! 🚀");
            await str.reply("💡 To exit the chat, use /exit command");
       
            prompt=true;
    
        } catch (error) {
          console.error("Error in askai ",error)    
   str.reply("❌ Something went wrong. Please try again later.") 
    }
});


bot.command("exit",async (str)=>{
        try {
        if(!str.from.username){
    str.reply("⚠️ Username not found. Please set up your Telegram username first.");
    return;
 }
 const user=await prisma.user.findUnique({
    where:{
        name:str.from.username
    }
 })

   if(!user){
        str.reply("❌ User not found. Please use /start to begin.")
        return 
    }

    if(prompt){
        prompt=false;
        str.reply("👋 Chat ended! Use /askai to start a new conversation.")
    }
        } catch (error) {
        console.error("error in exit",error);
        str.reply("❌ Something went wrong. Please try again later.");         
        }
})


bot.on(message("text"),async (str,next)=>{
    try {
     if(!prompt || str.message.text.startsWith('/')){
        return next();
     }
 

       if(!str.from.username){
    str.reply("⚠️ Username not found. Please set up your Telegram username first.");
    return;
 }
 const user=await prisma.user.findUnique({
    where:{
        name:str.from.username
    }
 })

   if(!user){
        str.reply("❌ User not found. Please use /start to begin.")
        return 
    }

    const replymessage=await helpfromGemini(str.message.text,str.from.first_name)
      await str.reply(replymessage)
} catch (error) {
          console.error("Error in text message handler:", error);
            str.reply("Something went wrong. Please try again later.");
    }
}) 
       tokenCommnads()
       createNFTcommands()
       WalletCommands();


     imageUpload() 

     bot.launch();

       process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM')) 
}


