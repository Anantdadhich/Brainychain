import { Context } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";
import { bot } from "../../telbot/bot.js";

const validurl = (urlString: string) => {
    const urlPattern = new RegExp('^(https?:\\/\\/)?' +
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
        '((\\d{1,3}\\.){3}\\d{1,3}))' +
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
        '(\\?[;&a-z\\d%_.~+=-]*)?' +
        '(\\#[-a-z\\d_]*)?$', 'i');
    return !urlPattern.test(urlString);
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
                            [{ text: "Go Back", callback_data: "goBack" }, { text: "Cancel", callback_data: "Cancel" }]
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
                            [{ text: "Go Back", callback_data: "goBack" }, { text: "Cancel", callback_data: "Cancel" }]
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
                            [{ text: "Go Back", callback_data: "goBack" }, { text: "Cancel", callback_data: "Cancel" }]
                        ]
                    }
                });
            }
            break;

            case 5 : 
            if(inputText){
                if(validurl(inputText)){
                    await ctx.reply("oops that does'nt look like a valid url ")
                   return;
                }
                tokeninfo.imgUrl=inputText;
                
            }
             

    }
}

let confirmMessage:Message

export async function getmetadatafromuser(ctx:Context){
      confirmMessage = await ctx.reply("Are you ready to create your token? 🎉", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Yes, let's go! 🚀", callback_data: "YesCreateToken" }, { text: "No, not now 😅", callback_data: "NoDontCreateToken" }]
            ]
        }
    })

    bot.action("no",(ctx)=>{
        
    })
}