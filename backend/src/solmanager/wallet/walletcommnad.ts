import { Context } from "telegraf";
import { WalletGenerate, warningMessage } from "./wallet";
import { bot } from "../../telbot/bot";
import prisma from "../../db";
import { message } from "telegraf/filters";
import bcrypt from "bcrypt"
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import dbMetricsUpdate, { getIsWallet, isWallet } from "../../db/function";
import { Message } from "telegraf/typings/core/types/typegram";
import CreateNFTcollec, { NFTdetails } from "../nft/createnftcollection";
import { TokenInfo } from "../token/getmetadata";
import  pTimeout from  "p-timeout"
import { creatminttoken } from "../token/createtoken";
import { CreateNFT } from "../nft/createnft";
let boton=false;

export async function handleWalletReply(ctx:Context){
    try {
     await ctx.reply(warningMessage ,{
        reply_markup:{
            inline_keyboard:[
              [{text : "Show Private Key Seed phrase and Public key", callback_data : 'ShowPvtKey'}],
                        [{text : "Show only Public key", callback_data : 'ShowPubKeyOnly'}]   
            ]
        }
     })
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
                ctx.reply("you have already wallet ")
                setTimeout(()=> 
                ctx.reply(`here is your wallet address \` ${user.walletaddress} \` `,{
                    parse_mode:"MarkdownV2"
                }),1000)
                return ;
            }

            await ctx.reply("Please enter the password ")
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
              await ctx.reply("error while generating your wallet ");
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
                await ctx.reply("error storing the password")
                boton=false;
                return;
               }
               await handleWalletReply(ctx);

            } catch (error) {
            console.log(error)
            await ctx.reply("error while in messgaing handler")
            boton=false;  
            }
           })
      

           bot.action("showPvtkey",async  (ctx)=>{
                try {
               const user=await prisma.user.findUnique({
                where:{
                    name:ctx.from.username
                }
               })

               if(!user){
                ctx.reply("no wallet find please create one wallet ")
                return
               }

               const mnemonic=user?.walletMnemonic;
                    const masterSeed=mnemonicToSeedSync(mnemonic);
                 const derivedSeed=derivePath("m/44'/501'/0'/0'",masterSeed.toString("hex")).key;
                 const walletkeypair=Keypair.fromSeed(derivedSeed);
                 const userPubkey=walletkeypair.publicKey.toBase58();
                 


                 await ctx.editMessageText(`your seed phrase ${mnemonic} `,{
                    reply_markup:{
                        inline_keyboard:[
                            [{
                            text:"delete the seed phrase",callback_data:"delete private key "
                            }]
                        ]
                    }
                 })  ;

             bot.action("deleteprivatekeychat",(ctx)=>{
                try {
               ctx.editMessageText("delete chat")
                } catch (error) {
                    console.error("error",error)
                }
             })
          
             await ctx.telegram.sendMessage(`${ctx.chat?.id}` ,"Public id");

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
           

          bot.action("showpubkey",async(ctx)=>{
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
            ctx.reply("please enter your password to continue ",{
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
            ctx.reply("no user found ");
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
                    confirmmess=await ctx.reply("this action will deduct some solana from your account are you sure  ?  to proced",{
                        reply_markup:{
                            inline_keyboard:[
                                [
                                    {text:"yes ",callback_data:"yes create"},
                                     {text:"no ",callback_data:"exit command"}
                                ]
                            ]

                        }
                    })

                    islist=false;
                  }else {
                await ctx.reply("wrong password");
                await ctx.reply("please try again ",{
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
                    ctx.reply("an error while process password")
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
           const {message_id} =await ctx.reply("Syncing with the blockchain... Web3 runs on trustless networks, so a few extra seconds now means a safer, decentralized future! While we connect, here's a pro tip: patience is your best crypto")
        //we will  check the user has a wallet  
        const user=await getIsWallet(ctx.from.username!)
        if(!user?.isWallet ===false){
            await ctx.reply("no wallet found",{
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
            const result = await pTimeout(creatminttoken(tokenmetadata as TokenInfo, ctx.from.username!), { milliseconds: 90000 });
              if(result){
                await ctx.deleteMessage(message_id);
                await dbMetricsUpdate(String(ctx.from.username

                ), {token:true});

                await ctx.reply(result.link);
                await  ctx.reply("operation success ");
                await ctx.reply("token not minted yet  /minttoken "  )

              } 
           
           } catch (error) {
             console.error("Error during token creation:", error);
           }
           
           //token creation, but uses createNFTCollection to create a group of NFTs.
         }else if(nftcoll) {
          try {
            //@ts-ignore
              const result=await pTimeout(CreateNFTcollec(tokenmetadata ,ctx.from.username!) ,  {milliseconds:90000});
              if(result){ 
                //delete the sync messaage 
                await ctx.deleteMessage(message_id);
                await dbMetricsUpdate(String(ctx.from.username) ,{nft:true});
                await ctx.reply(result.link)
                await ctx.reply(" created successfully ")
               
              }
          } catch (error) {
             console.error("Error during NFT collection creation:", error);
                        ctx.reply("Sorry, the operation took too long and timed out. Please try again later."); 
          }
         }else if (nftReg){
           try {
            //@ts-ignore
             const result=await pTimeout(CreateNFT(tokenmetadata ,ctx.from.username!),{milliseconds:90000});
            if(result){
                await ctx.deleteMessage(message_id);
                await dbMetricsUpdate(String(ctx.from.username) ,{nft:true})
               await ctx.reply(result.link);
               await ctx.reply("operation succeess ")
               
     
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