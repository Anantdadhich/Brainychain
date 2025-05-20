import { Message } from "telegraf/types";

import { Context } from "telegraf";
import { WalletDeduction } from "../wallet/walletcommnad";
import { bot } from "../../telbot/bot";
import { message } from "telegraf/filters";
import { uploadImagePermUrl } from "../imageuploader/commands";
import { WARNING_MESSAGE_IMAGE_UPLOAD } from "../token/tokenmessage";



const isValidUrl = (urlString: string) => {
    var urlPattern = new RegExp('^(https?:\\/\\/)?' + 
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + 
    '((\\d{1,3}\\.){3}\\d{1,3}))' + 
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + 
    '(\\?[;&a-z\\d%_.~+=-]*)?' + 
    '(\\#[-a-z\\d_]*)?$', 'i');
    return !urlPattern.test(urlString);
};

export interface NFTdetais {
    tokenname:string,
    symbol:string,
    description:string,
    imgUrl:string,
    traits:string
}


let stage=1;
export let nftcollection:NFTdetais ={
    tokenname:"",
    symbol:"",
    description:"",
    imgUrl:"",
    traits:""
}

let isMetadataliste=false;
let isPhotolist=false;

let message1:Message;
let message2:Message;
let message3:Message;
let message4:Message;
let message5:Message;

async function cancelProcess(str:Context){
    isMetadataliste=false;
    isPhotolist=false;
    stage=1;
    await str.reply("Cancelled. You can start over when you're ready!")
}

async function goBack(str:Context,next:()=> void){
    stage=Math.max(1,stage-1);

    await handleStage(str,null,next)
}

async function handleStage(ctx: Context, inputText: string | null, next: () => void) {
    switch (stage) {
        case 1:
            if (inputText) {
                if (inputText.length > 32) {
                    await ctx.reply("🚨 Please enter a collection name with less than 32 characters.");
                    return;
                }
                nftcollection.tokenname = inputText;
                stage = 2;
                await handleStage(ctx, null, next);
            } else {
                message1 = await ctx.reply("First, enter a name for your collection (e.g., 'MyNFTCollection'). 📝 (Max 32 characters)", {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "⬅️ Go Back", callback_data: "goBack" }, { text: "❌ Cancel", callback_data: "cancel" }]
                        ]
                    }
                });
            }
            break;

        case 2:
            if (inputText) {
                if (inputText.length > 10) {
                    await ctx.reply("🚫 Symbol is too long! Please enter a symbol with less than 10 characters.");
                    return;
                }
                nftcollection.symbol = inputText;
                stage = 3;
                await handleStage(ctx, null, next);
            } else {
                message2 = await ctx.reply("💬 Enter a short symbol or ticker for your collection (max 10 characters).", {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "⬅️ Go Back", callback_data: "goBack" }, { text: "❌ Cancel", callback_data: "cancel" }]
                        ]
                    }
                });
            }
            break;

        case 3:
            if (inputText) {
                if (inputText.length > 200) {
                    await ctx.reply("✍️ Keep it short! Please enter a description with less than 200 characters.");
                    return;
                }
                nftcollection.description = inputText;
                stage = 4;
                await handleStage(ctx, null, next);
            } else {
                message3 = await ctx.reply("📜 Add a brief description for your collection. What makes it unique? (Max 200 characters)", {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "⬅️ Go Back", callback_data: "goBack" }, { text: "❌ Cancel", callback_data: "cancel" }]
                        ]
                    }
                });
            }
            break;

        case 4:
            if (inputText) {
                nftcollection.traits = inputText;
                stage = 5;
                await handleStage(ctx, null, next);
            } else {
                message4 = await ctx.reply("🔢 Enter any specific traits or characteristics for this NFT collection (e.g., rarity, color).", {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "⬅️ Go Back", callback_data: "goBack" }, { text: "❌ Cancel", callback_data: "cancel" }]
                        ]
                    }
                });
            }
            break;

        case 5:
            if (inputText) {
                if (isValidUrl(inputText)) {
                    await ctx.reply("🔗 Oops! That doesn't look like a valid URL. Please try again.");
                    return;
                }
                nftcollection.imgUrl = inputText;
                const isConfirmed = await WalletDeduction({ nftcoll: true }, ctx, nftcollection);
                if (isConfirmed) {
                    stage = 1;
                    await ctx.reply("🎉 Success! We got your NFT collection metadata! 🚀");
                    next();
                } else if (!isConfirmed) {
                    stage = 1;
                    next();
                    isMetadataliste = false;
                    isPhotolist= false;
                }
            } else {
                message5 = await ctx.reply("🖼️ What would you like to upload?", {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "📸 Image", callback_data: "imgUp" }],
                            [{ text: "🌐 URL of Image", callback_data: "urlUp" }],
                            [{ text: "⬅️ Go Back", callback_data: "goBack" }, { text: "❌ Cancel", callback_data: "cancel" }]
                        ]
                    }
                });
            }
            break;
    }
}


let confirmMessage:Message;

export async function getNFTCollectionmetadata(str:Context){

    confirmMessage=await str.reply("Are you ready to create your nft collection ",{
        reply_markup:{
            inline_keyboard:[
                [{
                    text:"yes lets go " ,callback_data:"yes nft created"
                },{
                    text:"No, not now",
                    callback_data:"no dont create nft "
                }]
            ]

        }
    })


    bot.action("NoDontCreateNFT",str =>{
        str.deleteMessage(confirmMessage.message_id);
        str.reply("Alright ")
        str.answerCbQuery("ok")
    })


    bot.action("YesCreateNFT",async(str,next)=>{
        str.deleteMessage(confirmMessage.message_id);
        await str.reply("important please do not use ")
        await str.answerCbQuery("lets start");
        isMetadataliste=true;
        await handleStage(str,null,next)
    });


    bot.action("imgup",async(str)=>{
        await str.reply(`${WARNING_MESSAGE_IMAGE_UPLOAD}`);
        isPhotolist=false;
        stage=5;
        await str.answerCbQuery()
    });

    bot.action("urlup",async(ctx)=>{
        await ctx.reply("please enter the imgage url");
        isPhotolist=false;
        stage=5;
        await ctx.answerCbQuery();
    });


    bot.on(message("photo"),async (ctx,next)=>{
     if(!isMetadataliste || !isPhotolist){
        return next();
     }


    const ImageUrl=await uploadImagePermUrl(ctx);

    if(ImageUrl){
        ctx.reply("here is your wallet ");
        ctx.reply(`[click to open in browwser](${ImageUrl.ipfsUrl[0]})`,{parse_mode:"MarkdownV2"});
        ctx.reply(`\`${ImageUrl.ipfsUrl[0] } \``,{parse_mode:"MarkdownV2"} )
        nftcollection.imgUrl=ImageUrl.ipfsUrl[0];
        const isConfirmed=await WalletDeduction({
            nftcoll:true
        },ctx,nftcollection);

        if(isConfirmed){
            stage=1;
            await ctx.reply("metadata with your image is all set ")
        }
        isMetadataliste=false;
        isPhotolist=false;
   
    }
    });

    bot.on(message("text"),async (ctx,next)=>{
        if(!isMetadataliste){
            return next();
        }

        const inputText=ctx.message.text;
        await handleStage(ctx,inputText,next)
    })


    bot.action("cancel",async (ctx)=>{
        await cancelProcess(ctx);
        await ctx.answerCbQuery("Process Cancelled");
    })


    bot.action("goback",async(ctx,next)=>{
       const msgtoDelete=[message1,message2,message3,message4,message5]
        for(let i=0 ;i< msgtoDelete.length;i++){
            if(stage ==i+1 && msgtoDelete[i]){
                ctx.deleteMessage(msgtoDelete[i].message_id)
            }
        }
        await goBack(ctx,next);
        await ctx.answerCbQuery("going baack")
    })
}

