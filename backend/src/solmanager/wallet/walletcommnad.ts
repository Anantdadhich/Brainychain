import { Context } from "telegraf";

import { message } from "telegraf/filters";
import bcrypt from "bcrypt"
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import { creatminttoken } from "../token/createtoken";
import { Message } from "telegraf/types";

import  pTimeout from  "p-timeout"
import { WalletGenerate, warningMessage } from "./wallet";
import { bot } from "../../telbot/bot";
import prisma from "../../db";
import dbMetricsUpdate, { getIsWallet, isWallet } from "../../db/function";
import CreateNFTcollec, { NFTdetails } from "../nft/createnftcollection";
import { TokenInfo } from "../token/getmetadata";
import { CreateNFT } from "../nft/createnft";

let boton=false;

export async function handleWalletReply(ctx:Context){
    try {
      await ctx.reply(warningMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Show Private Key, Seed Phrase, and Public Key", callback_data: 'ShowPvtKey' }],
            [{ text: "Show Only Public Key", callback_data: 'ShowPubKeyOnly' }]
          ]
        }
      });
    } catch (error) {
        console.log(error);
        await ctx.reply("something went wrong");
        boton=false
    }
}


export default async function  WalletCommands(){
    
    try {
     bot.command("createwallet",async (ctx)=>{
           try {
         const user=await prisma.user.findUnique({
            where:{
                name:ctx.from.username
            }
         })

            if(user?.walletSecretkey){
                ctx.reply("You already have a wallet ")
                setTimeout(()=> 
                ctx.reply(`Here is your wallet address \` ${user.walletaddress} \` `,{
                    parse_mode:"MarkdownV2"
                }),1000)
                return ;
            }

            await ctx.reply("Please enter a password to secure your wallet ")
            boton=true;

           bot.on(message("text"),async(ctx,next)=>{
            try {
            if(!bot){
                return next();
            }


            let walletinfo ;
            try {
              walletinfo=await WalletGenerate(ctx.from.username!);

            } catch (error) {
              console.log(error)
              await ctx.reply("There was an error while generating your wallet ");
              boton=false;
              return ;  
            }
               try {
                const salt=await bcrypt.genSalt(10);
                 const hashPassword=await bcrypt.hash(ctx.message.text,salt)
   
                   await prisma.user.update({
                    where:{
                        name:ctx.from.username 
                    },data:{
                        passwordhash:hashPassword
                    }
                   })
                } catch ( erro) {
                console.log(erro);
                await ctx.reply("There was an error saving your password. Please try again.")
                boton=false;
                return;
               }
               await handleWalletReply(ctx);

            } catch (error) {
            console.log(error)
            await ctx.reply("An error occurred while handling your message.")
            boton=false;  
            }
           })
      

           bot.action("ShowPvtKey",async  (ctx)=>{
                try {
               const user=await prisma.user.findUnique({
                where:{
                    name:ctx.from.username
                }
               })

               if(!user){
                ctx.reply("No wallet found. Please create one using /createwallet.")
                return
               }

               const mnemonic=user?.walletMnemonic;
                    const masterSeed=mnemonicToSeedSync(mnemonic);
                 const derivedSeed=derivePath("m/44'/501'/0'/0'",masterSeed.toString("hex")).key;
                 const walletkeypair=Keypair.fromSeed(derivedSeed);
                 const userPubkey=walletkeypair.publicKey.toBase58();
                 


                 await ctx.editMessageText(`Here is your seed phrase ${mnemonic} `,{
                    reply_markup:{
                        inline_keyboard:[
                            [{
                            text:"delete the seed phrase",callback_data:"deleteprivatekeychat"
                            }]
                        ]
                    }
                 })  ;

             bot.action("deleteprivatekeychat",(ctx)=>{
                try {
               ctx.editMessageText("Seed phrase deleted successfully.")
                } catch (error) {
                    console.error("error",error)
                }
             })
          
             await ctx.telegram.sendMessage(`${ctx.chat?.id}` ,"Here is your public key:");

             setTimeout(() => {
                 ctx.reply(`\` ${walletkeypair.publicKey.toBase58()} \` tap to copy ` ,{
                    parse_mode:"MarkdownV2"
                 })
             }, 1000);
               setTimeout(() => ctx.reply(`🎉 Your wallet has been created successfully! Start by depositing 1 SOL and use the /createtoken command to create your token. 🚀`), 2000)
                   await isWallet(ctx.from.username!);
                } catch (error) {
                    console.log(error);
                    await ctx.reply("an error while generating the private key")
                }
           })
           

          bot.action("ShowPubKeyOnly",async(ctx)=>{
              try {
                 const user=await prisma.user.findUnique({
                    where:{
                        name:ctx.from.username
                    }
                 })
                 const walletdetails=JSON.parse(Buffer.from(user?.walletSecretkey! ,"base64").toString());
                 const walletkeypair=Keypair.fromSecretKey(walletdetails.secretKey);

                 if(!walletdetails){
                    ctx.reply("no wallet found ");
                    return;
                 }

                 await ctx.editMessageText("public id");
                setTimeout(() => ctx.reply(`\`${walletkeypair.publicKey.toBase58()}\` tap to copy`, {parse_mode : "MarkdownV2"}), 1000)
                        setTimeout(() => ctx.reply(`🎉 Your wallet has been created successfully! Start by depositing 1 SOL and use the /createToken command to create your token. 🚀`), 2000)
                      await isWallet(ctx.from.username!);
                } catch (error) {
               console.log("error while ",error);
               ctx.reply("Error in  generating public key ")
              }
          })          

           } catch (error) {
                console.error("Error in createwallet command:", error);
                ctx.reply("An unexpected error occurred");
           }
     })
    } catch (error) {
             console.error("Error in wallet command:", error);
               
    }

}


interface nftorToken{
    nftcoll?:boolean,
    token?:boolean,
    nftReg?:boolean
}

let isyes=false;
let confirmmess:Message;
let islist=false;



export async function WalletDeduction({ nftcoll,
    token,
    nftReg}:nftorToken,ctx:Context,tokenmetadata:NFTdetails|TokenInfo){
     try {
        setTimeout(()=>{
            ctx.reply("Please enter your password to continue ",{
                reply_markup:{
                    force_reply:true
                }
            })
        },1500)

        const user=await prisma.user.findUnique({
            where:{
                name:ctx.from?.username
            }
        })

        if(!user){
            ctx.reply("User not found. Please create a wallet first.");
            return  
        }
        
        const secretkeybuffer=Buffer.from(user.walletSecretkey!,'base64');

        islist=true;

        bot.on(message("text"),async (ctx,next)=>{
            try {
                if(!islist){
                    return next()
                }

                try {
                  const result=await bcrypt.compare(ctx.message.text,user.passwordhash)

                  if(result){
                    confirmmess=await ctx.reply("⚠️ This action will deduct some SOL from your wallet. Are you sure you want to proceed?",{
                        reply_markup:{
                            inline_keyboard:[
                                [
                                    {text:"yes ",callback_data:"yescreate"},
                                     {text:"no ",callback_data:"exit command"}
                                ]
                            ]

                        }
                    })

                    islist=false;
                  }else {
                await ctx.reply("Incorrect password. Please try again.");
                await ctx.reply("Password processing failed. Please try again. ",{
                    reply_markup:{
                        force_reply:true,
                        inline_keyboard:[
                            [ {text:"no",callback_data:"cancel"  }]
                        ]
                    }
                })
                islist=false;
                
                }

                } catch (error) {
                    console.log("error in password",error);
                    ctx.reply("Password processing failed. Please try again.")
                }
            } catch (error) {
                console.error("err",error);
                ctx.reply("error in  message handler ")
            }
        })

         bot.action("cancel", (ctx) => {
            try {
                ctx.reply("Ok 🤨");
                isyes = false;
                islist = false;
            } catch(error) {
                console.error("Error in cancel action:", error);
            }
        })

        bot.action("yescreate",async (ctx)=>{
            try {
        await  ctx.deleteMessage(confirmmess.message_id)
           isyes=true;
      //nds a message to the user, explaining that the bot is connecting to the blockchain. The process might take some time because blockchain transactions are decentralized.
           const {message_id} =await ctx.reply("🔄 Syncing with the blockchain... This might take a few seconds. Trustless networks take time, but ensure safety. Tip: Patience is a powerful crypto tool! 🕒")
        //we will  check the user has a wallet  
        const user=await getIsWallet(ctx.from.username!)
        if(!user?.isWallet ===false){
            await ctx.reply("No wallet found. Please create one",{
                reply_markup:{
                    inline_keyboard:[
                        [{text:"genrate wallet " ,callback_data:"go baclk generate"}]
                    ]
                }
            })
            bot.action("generate",()=> {
                WalletCommands()
            })
            islist=false;
            return ;
        }
         //if user wants to create a token 
         if(token){
         //operation is wrapped in pTimeout, which gives it a maximum time limit of 90 seconds.   
           try {
            //@ts-ignore
            const result = await pTimeout(creatminttoken(tokenmetadata as TokenInfo, ctx.from.username!), 90000);
              if(result){
                await ctx.deleteMessage(message_id);
                await dbMetricsUpdate(String(ctx.from.username

                ), {token:true});

                await ctx.reply(result.link);
                await  ctx.reply("✅ Token created successfully!");
                await ctx.reply("⚠️ Token is not minted yet. Please use /minttoken to mint it."  )

              } 
           
           } catch (error) {
             console.error("Error during token creation:", error);
           }
           
           //token creation, but uses createNFTCollection to create a group of NFTs.
         }else if(nftcoll) {
          try {
            //@ts-ignore
              const result=await pTimeout(CreateNFTcollec(tokenmetadata ,ctx.from.username!) ,  90000);
              if(result){ 
                //delete the sync messaage 
                await ctx.deleteMessage(message_id);
                await dbMetricsUpdate(String(ctx.from.username) ,{nft:true});
                await ctx.reply(result.link)
                await ctx.reply("✅ NFT collection created successfully!")
               
              }
          } catch (error) {
             console.error("Error during NFT collection creation:", error);
                        ctx.reply("Sorry, the operation took too long and timed out. Please try again later."); 
          }
         }else if (nftReg){
           try {
            //@ts-ignore
             const result=await pTimeout(CreateNFT(tokenmetadata ,ctx.from.username!), 90000);
            if(result){
                await ctx.deleteMessage(message_id);
                await dbMetricsUpdate(String(ctx.from.username) ,{nft:true})
               await ctx.reply(result.link);
               await ctx.reply("✅ NFT created successfully!")
               
     
            }
           } catch (error) {
           console.error("Error during regular NFT creation:", error);
                        ctx.reply("Sorry, the operation took too long and timed out. Please try again later.");  
           }
         }

        } catch (error) {
             console.error("Error in yesCreate action:", error);
                ctx.reply("An unexpected error occurred");   
            }
        });

      bot.action("exitcommand",(ctx)=>{
        try {
         ctx.deleteMessage(confirmmess.message_id);
         isyes=false;
         ctx.reply("Ok");
         ctx.answerCbQuery("ok")
        } catch (error) {
            console.error("Error in exitCommand action:", error);  
        }
      })
         return isyes
    } catch (error) {
    console.error("Error in confirmWalletDeduction:", error);
        ctx.reply("An unexpected error occurred");
        return false;    
     }

}

export async function hashPassandstore(ctx:Context,password:string ){
    try {
        const salt=await bcrypt.genSalt(10);
        const hashPassword=await bcrypt.hash(password,salt);
        await prisma.user.update({
            where:{
                name:ctx.from?.username
            },data:{
                passwordhash:hashPassword
            }
        })
    } catch (error) {
         console.error("Error in hashPassAndStore:", error);
        throw error;
    }
}