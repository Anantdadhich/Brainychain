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
const messagestart= `Welcome to BrainyChain ! 🌐

Empower your Web3 journey with BrainyChain. Quickly generate wallets, seamlessly create tokens, and effortlessly mint NFTs. Store your digital assets forever.

`;

let isbotstarting=false;

export default function botCommands(){
bot.command("start",async(str)=>{
    try {
        if(!str.from?.username){
          str.reply("No username found. Please register your username in Telegram first before using this bot.");
                return;   
        }

        await addUser(str.from.username);
        bot.telegram.sendMessage(str.chat.id,messagestart)
       str.reply("To secure your wallet, please create a strong password. This will help protect your assets and keep your account safe!",{reply_markup:{force_reply:true}});
        isbotstarting=true;

        bot.on(message("text"),async(str,next)=>{
      try {
          if(!isbotstarting){
            return  next();
          }

          str.reply("Password set succesfully");
          str.reply("start with /createwalleet");

      setTimeout(()=>hashPassandstore(str,str.message.text),1000)
      isbotstarting=false;
      } catch (error) {
           console.error("Error in text message handler:", error);
                    str.reply("An error occurred while setting password");
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
    str.reply("no username");
    return;
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

    await str.reply("Hey there! 👋 I'm BrainyChain, your AI-powered Telegram bot created by adtech 🤖. Feel free to ask me anything – I'm here to help with token creation 💰, NFT minting 🎨, wallet management 🔐, and so much more! Just drop your question, and I'll be ready for the next chat! 💬");
            await str.reply("To exit the chat, use /exit command");
       
            prompt=true;
    
        } catch (error) {
          console.error("Error in askai ",error)    
   str.reply("something went wrong ") 
    }
});


bot.command("exit",async (str)=>{
        try {
        if(!str.from.username){
    str.reply("no username");
    return;
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

    if(prompt){
        prompt=false;
        str.reply("hat ended! Use /askai to start a new chat.")
    }
        } catch (error) {
        console.error("error in exit",error);
        str.reply("something went wrong");         
        }
})


bot.on(message("text"),async (str,next)=>{
    try {
     if(!prompt || str.message.text.startsWith('/')){
        return next();
     }
 

       if(!str.from.username){
    str.reply("no username");
    return;
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

