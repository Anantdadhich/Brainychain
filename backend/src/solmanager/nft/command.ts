import { PublicKey } from "@solana/web3.js";
import prisma from "../../db";
import { bot } from "../../telbot/bot.js";
import { balanceFromWallet, convertToKeyPair } from "../wallet/wallet.js";
import { INSUFFICIENT_BALANCE_MSG } from "../token/tokenmessage.js";
import { Message } from "telegraf/typings/core/types/typegram";
import { getNFTCollectionmetadata } from "./getnftcollection.js";
import { getNFTmetadata } from "./getnft.js";



let optionMessage:Message;

export default async function createNFTcommands(){
    bot.command("createnft",async ctx=>{
      const user=await prisma.user.findUnique({
        where:{
            name:ctx.from.username
        }
      })

    if(!user){
        await ctx.reply("no user found")
        return 
    }  

    const mnemonic=user.walletMnemonic;
    if(!mnemonic){
        await ctx.reply("no wallet found")
        return 
    }

    const wallet=await convertToKeyPair(mnemonic);

    try {
         const balance=await balanceFromWallet(new PublicKey(wallet.userpubkey));
          if(balance===0){
            ctx.reply(INSUFFICIENT_BALANCE_MSG);
            setTimeout(() =>  ctx.reply(
                `\`${wallet.userpubkey}\``, {
                    parse_mode:"MarkdownV2"
                }
            ),1000)
            return  
          }
         
    } catch (error) {
          ctx.reply('can t get balance try later ');
            setTimeout(() =>  ctx.reply(
                `\`${wallet.userpubkey}\``, {
                    parse_mode:"MarkdownV2"
                }
            ),1000)
            return  
    }
      
     optionMessage=await ctx.reply("Would you like to make an collectibe nft or Reg nft",{
        reply_markup:{
            inline_keyboard:[
                  [{text : "Create Colllectible", callback_data : "startCollectible"}],
                        [{text : "Create Regular NFT", callback_data : "createNFT"}]
            ]
        }
     })

     bot.action("startcollectiable",async ctx =>{
        try {
          ctx.deleteMessage(optionMessage.message_id);
          await getNFTCollectionmetadata(ctx);
          ctx.answerCbQuery("Connection with NFT collection creation")
        } catch (error) {
               console.error(error);
                    ctx.reply("An error occurred while creating the collectible. Please try again."); 
        }
     })

     bot.action("createNFT",async ctx =>{
        try {
            ctx.deleteMessage(optionMessage.message_id);
        ctx.answerCbQuery("connecting with NFT creation")
        await getNFTmetadata(ctx)
        } catch (error) {
            console.error(error);
                    ctx.reply("An error occurred while creating the NFT. Please try again.");    
        }
     })
    
    })
}