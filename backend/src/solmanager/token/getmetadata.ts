import { Context } from "telegraf";
import { Message } from "telegraf/types";
import { bot } from "../../telbot/bot";
import { WARNING_MESSAGE_IMAGE_UPLOAD } from "./tokenmessage";
import { message } from "telegraf/filters";
import { uploadImagePermUrl } from "../imageuploader/commands";
import { WalletDeduction } from "../wallet/walletcommnad";


const validurl = (urlString: string) => {
    const urlPattern=new RegExp('^(https?:\\/\\/)?' + 
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + 
        '((\\d{1,3}\\.){3}\\d{1,3}))' + 
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + 
        '(\\?[;&a-z\\d%_.~+=-]*)?' + 
        '(\\#[-a-z\\d_]*)?$', 'i');
    return urlPattern.test(urlString);
}

export interface TokenInfo {
    tokenname: string;
    symbol: string;
    description: string;
    decimals: number;
    imgUrl: string;
}

let stage = 1;

export let tokeninfo: TokenInfo = {
    tokenname: "",
    symbol: "",
    description: "",
    decimals: 9,
    imgUrl: ""
};

let isimage = false;
let ismetadatalist = false;
let isPhlist = false;

async function cancelProcess(ctx: Context) {
    ismetadatalist = false;
    isPhlist = false;
    stage = 1;
    await ctx.reply("Process Cancelled");
}

async function Back(ctx: Context, next: () => void) {
    stage = Math.max(1, stage - 1);
    await handleStage(ctx, null, next);
}

let message1: Message;
let message2: Message;
let message3: Message;
let message4: Message;
let message5: Message;

async function handleStage(ctx: Context, inputText: string | null, next: () => void) {
    switch (stage) {
        case 1:
            if (inputText) {
                if (inputText.length > 32) {
                    await ctx.reply("Please enter token name under 32 characters.");
                    return;
                }
                tokeninfo.tokenname = inputText;
                stage = 2;
                await handleStage(ctx, null, next);
            } else {
                message1 = await ctx.reply("First, enter a name for your token (max 32 characters): ex(mytoken)", {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Go back", callback_data: "goBack" }, { text: "Cancel", callback_data: "cancel" }]
                        ]
                    }
                });
            }
            break;

        case 2:
            if (inputText) {
                if (inputText.length > 10) {
                    await ctx.reply("Symbol is too long. Please enter a symbol within 10 characters.");
                    return;
                }
                tokeninfo.symbol = inputText;
                stage = 3;
                await handleStage(ctx, null, next);
            } else {
                message2 = await ctx.reply("Enter your symbol (max 10 characters):", {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Go Back", callback_data: "goBack" }, { text: "Cancel", callback_data: "cancel" }]
                        ]
                    }
                });
            }
            break;

        case 3:
            if (inputText) {
                if (inputText.length > 200) {
                    await ctx.reply("Description is too long. Please enter a description within 200 characters.");
                    return;
                }
                 tokeninfo.description = inputText;
                stage = 4;
                await handleStage(ctx,null,next)
            }else {
                message3= await ctx.reply("Enter your description (max 200 characters):", {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Go Back", callback_data: "goBack" }, { text: "Cancel", callback_data: "cancel" }]
                        ]
                    }
                });
            }
            break;
        
            case 4 : 
              if (inputText) {
                const decimalsInput=parseInt(inputText);
                if(isNaN(decimalsInput) || decimalsInput <0 || decimalsInput >18){
                     await ctx.reply("Please enter a valid input between 1 to 18 for decimals place  ")
                        return ;
                    }
                 tokeninfo.decimals =decimalsInput;
                stage = 5;
                await handleStage(ctx,null,next)
            }else {
                message4= await ctx.reply("how many decimals your token support (from 1 to 18 ):", {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Go Back", callback_data: "goBack" }, { text: "Cancel", callback_data: "cancel" }]
                        ]
                    }
                });
            }
            break;

            case 5 : 
            if(inputText){
                if(validurl(inputText)){
                    await ctx.reply("Oops! That doesn't look like a valid URL. Please enter a valid image URL.")
                   return;
                }
                tokeninfo.imgUrl=inputText;
                const confirm = await WalletDeduction({token: true}, ctx, tokeninfo);
                if(confirm) {
                    stage = 1;
                    await ctx.reply("Success! Token metadata created.");
                    next();
             } else if(!confirm){
                    stage = 1; 
                    next()
                    ismetadatalist = false;
                    isPhlist = false;
                     
                }
            } else {
                message5 = await ctx.reply("Please choose what would you like to Upload for your token url", {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "📸 Image", callback_data: "imgUp" }],
                            [{ text: "🌐 URL of Image", callback_data: "urlUp" }],
                            [{ text: "Go Back", callback_data: "goBack" }, { text: "Cancel", callback_data: "cancel" }]
                        ]
                    }
                });
            }
            break;

    }
}

let confirmMessage:Message

export async function getmetadatafromuser(ctx:Context){
      confirmMessage = await ctx.reply("Are you ready to create your token? 🎉", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Yes, let's go! 🚀", callback_data: "YesCreate" }, { text: "No, not now 😅", callback_data: "NoDontCreate" }]
            ]
        }
    })

    bot.action("NoDontCreate",(ctx)=>{
         ctx.reply("Alright may be next time ")
         ctx.answerCbQuery("ok")
    })

    bot.action("YesCreate",async(ctx,next)=>{ 
        ctx.deleteMessage(confirmMessage.message_id) 
        await ctx.reply("Important please do not use any other commands while creating your tokens .this could be disrupt the process")
        await ctx.answerCbQuery("lets go started") 

        ismetadatalist=true 
        handleStage(ctx,null,next) 
                 
    })
    
    bot.action("imgUp",async(ctx)=>{
        ctx.deleteMessage(message5!.message_id) 
        await ctx.reply(`${WARNING_MESSAGE_IMAGE_UPLOAD}`) 
        isPhlist=true 
        await ctx.answerCbQuery() 
    })
   

    bot.action("urlUp",async (ctx)=>{
        ctx.deleteMessage(message5!.message_id) 
        await ctx.reply("please enter the image url") 
        isPhlist=false 
        stage=5 
        await ctx.answerCbQuery() 
    })

   
    bot.on(message("photo"), async (ctx, next) => {
        if (!ismetadatalist || !isPhlist) {
            return next();
        }
        const imageUrl = await uploadImagePermUrl(ctx);
        if (imageUrl) {
            ctx.reply("Here is your image link");
            ctx.reply(`[Click to open in browser](${imageUrl.ipfsUrl})`, { parse_mode: 'MarkdownV2' });
            ctx.reply(`\`${imageUrl.ipfsUrl}\``, { parse_mode: 'MarkdownV2' });
            tokeninfo.imgUrl = imageUrl.ipfsUrl;
            const isConfirmed = await WalletDeduction({ token: true }, ctx, tokeninfo);
            if (isConfirmed) {
                stage = 1;
                await ctx.reply("🎉 Metadata with your uploaded image is all set!");
            }else if(!isConfirmed){
                stage = 1;
                next();
                ismetadatalist = false;
                isPhlist = false;
            }
        }
    });
    
    bot.on(message("text"), async (ctx, next) => {
        if (!ismetadatalist) {
            return next();
        }

        const inputText = ctx.message.text;
        await handleStage(ctx, inputText, next);
    });

    bot.action("cancel", async (ctx) => {
        await cancelProcess(ctx);
        await ctx.answerCbQuery("Process cancelled");
    });

    bot.action("goBack", async (ctx, next) => {
        const msgToDelete = [message1, message2, message3, message4, message5!];
        for (let i = 0; i < msgToDelete.length; i++) {
            if (stage === i + 1 && msgToDelete[i]) {
                ctx.deleteMessage(msgToDelete[i].message_id);
            }
        }
        await Back(ctx, next);
        await ctx.answerCbQuery("Going back");
    });

}
