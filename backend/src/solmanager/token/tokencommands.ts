import { PublicKey } from "@solana/web3.js";
import { bot } from "../../telbot/bot";
import prisma from "../../db";
import { balanceFromWallet, convertToKeyPair } from "../wallet/wallet";
import { ENTER_MINT_AMOUNT_MSG, ENTER_PUBLIC_KEY_MSG, INSUFFICIENT_BALANCE_MSG, INVALID_AMOUNT_MSG, INVALID_PUBLIC_KEY_MSG, MINT_ERROR_MSG, MINT_SUCCESS_MSG, MINT_TOKEN_DESTINATION_MSG, MINTING_PROCESS_ERROR_MSG } from "./tokenmessage";
import { getmetadatafromuser } from "./getmetadata";
import { message } from "telegraf/filters";
import { mintToken } from "./createtoken";







export default async function tokenCommnads() {
    bot.command("createtoken",async(str)=>{
        const user=await prisma.user.findUnique({
            where:{
                name:str.from.username
            }
        })

        const mnemonic=user?.walletMnemonic
        const wallet=await convertToKeyPair(mnemonic!)

        try {
            const balance=await balanceFromWallet(wallet.userkeypair.publicKey);

            if(balance===0){
                str.reply(INSUFFICIENT_BALANCE_MSG);
                setTimeout(() =>   str.reply(`\`${wallet.userkeypair.publicKey}\`` ,{
                    parse_mode:"MarkdownV2"
                }),1000  );

                 return ;  
            }
          await getmetadatafromuser(str);
        } catch (error) {
            console.log(error)
        }
    });
     let tokenPublicKey:PublicKey;

    let mintokenlist=false;
    let exitAclist=false;
    let isexternalaclist=false;

    bot.command("minttoken",async(ctx)=>{
        await ctx.reply("please enter the public key of the token ", {reply_markup:{
            force_reply:true
        }})

        const base58Regx=/^[1-9A-HJ-NP-Za-km-z]+$/;

        mintokenlist=true;
        bot.on(message("text"),async (ctx,next)=>{
            if(!mintokenlist) {
                return next()
            }

            const inputtext=ctx.message.text.trim();
            
            try {
              if(!base58Regx.test(inputtext)){
                throw new Error("invalid characters in the inputext")
              }
              tokenPublicKey=new PublicKey(inputtext)
              //now show the mint tokens

              await ctx.reply(MINT_TOKEN_DESTINATION_MSG ,{
                reply_markup:{
                    inline_keyboard:[
                     [{ text: "🔹 Mint to Current Account", callback_data: "existAc" }],
                            [{ text: "🔹 Mint to External Account (via Public Key)", callback_data: "externalAc" }]       
                    ]
                }
              })
              mintokenlist=false;
            } catch (error) {
        console.error("error validating token public keys ",error)
         await  ctx.reply("invalid token public key")
          mintokenlist=false;
          return ;
            }
        })        

    }) ;


    bot.action("exitac",async (ctx)=>{
        const user=await prisma.user.findUnique({
            where:{
                name:ctx.from.username
            }
        })

        const mnemonic=user?.walletMnemonic;
        const userwallet=await convertToKeyPair(mnemonic!);

        await ctx.reply(ENTER_MINT_AMOUNT_MSG);

       exitAclist=true;
       bot.on(message("text"),async (ctx,next)=>{
        if(!exitAclist) return next();
        const mintaccount=parseFloat(ctx.message.text);
          if(isNaN(mintaccount) || mintaccount <=0){
            return ctx.reply(INVALID_AMOUNT_MSG);
          } 

          const isminted=await mintToken(tokenPublicKey,mintaccount,9,new PublicKey(userwallet.userpubkey),ctx.from.username)
               if (isminted) {
                    ctx.reply(MINT_SUCCESS_MSG("Token", "your account"));
                } else {
                    ctx.reply(MINT_ERROR_MSG("Token"));
                }
             exitAclist=false;
        }) 
    })

    bot.action("externalac",async (ctx)=>{
        let stage=1;
        let pubKey:PublicKey;
      const baase58RRegx=  /^[1-9A-HJ-NP-Za-km-z]+$/;


      async function promptforPublickey(){
        await ctx.reply(ENTER_PUBLIC_KEY_MSG)
        stage=1;
      }

      async function promptformintamount(){
        await ctx.reply(ENTER_MINT_AMOUNT_MSG)
        stage=2;
      }


      await promptforPublickey();

      exitAclist=true;
      bot.on(message("text"),async (ctx,next)=>{
        if(!exitAclist) return next();
        const inputtext=String(ctx.message.text).trim();
         if(stage===1){
            try {
           if(!baase58RRegx.test(inputtext)){
            throw new Error("invalid characters in the input  ")
           }
            pubKey=new PublicKey(inputtext);
            await promptformintamount();
            } catch (error) {
                console.error("Error while converting to PublicKey",error);
                await ctx.reply(INVALID_PUBLIC_KEY_MSG);
                return await promptforPublickey();
            }
         }else if(stage===2){
            const mintamount=parseFloat(inputtext);
            if(isNaN(mintamount) || mintamount <= 0){
                return  ctx.reply(INVALID_AMOUNT_MSG)
            }
            const {message_id}=await ctx.reply("Minting in Progess ")
            try {
             const minted=await mintToken(tokenPublicKey,mintamount,9,pubKey,ctx.from.username)
             if(minted){
                await ctx.telegram.deleteMessage(ctx.chat.id,message_id)
                await ctx.reply(MINT_SUCCESS_MSG("Token",pubKey.toString()));

             }else {
                await ctx.telegram.deleteMessage(ctx.chat.id,message_id)
                await ctx.reply(MINT_ERROR_MSG("Token"));
             }
            } catch (error) {
                console.error("Error while minting token:", error);
                    await ctx.telegram.deleteMessage(ctx.chat.id, message_id);
                    await ctx.reply(MINTING_PROCESS_ERROR_MSG);
            }
         }
      })

    })
}