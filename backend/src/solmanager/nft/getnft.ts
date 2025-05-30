import { Context } from "telegraf";
import { Message } from "telegraf/types";

import { message } from "telegraf/filters";
import { WalletDeduction } from "../wallet/walletcommnad";
import { bot } from "../../telbot/bot";
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
}




export interface NFTdetais{
    tokenname:string,
    symbol:string,
    description:string,
    imgUrl:string,
    collectibleId:string
} 

let stage=1;

export let nftdetails:NFTdetais={
 tokenname:"",
 symbol:"",
 description:"",
 imgUrl:"",
 collectibleId:""
}


let isMetalist=false;
let isPhotolist=false;

let message1:Message|undefined
let message2:Message|undefined
let message3:Message|undefined
let message4:Message|undefined
let message5:Message|undefined
 
//add the cancel and goback function

async function cancelProcess(ctx:Context){
    isMetalist=false;
    isPhotolist=false;
    stage=1;
    await ctx.reply("Procces cancelled")
}

async function goBack(ctx:Context,next:()=>void){  
     stage=Math.max(1,stage-1);
     await handleStage(ctx,null,next)
}


export async function handleStage(ctx:Context,inputText:string |null ,next: ()=>void){
   switch(stage){
    case 1 : 
         if(inputText){
             if(inputText.length > 32){
                await ctx.reply("Please enter a NFT name less than 32 chars")
                return 
             }
             nftdetails.tokenname=inputText;
             stage=2;
             await handleStage(ctx,null,next);

         }else {
            message1=await ctx.reply("Please enter a name for your NFT (max 32 characters)", {
                reply_markup:{
                    inline_keyboard :[
                        [
                            {text:"Goback" ,callback_data:"Back"},
                            { text: "❌ Cancel", callback_data: "cancel" }
                        ]
                    ]
                }
            })
         }

        break;
    case 2 :
          if(inputText){
             if(inputText.length > 10){
                await ctx.reply("Please enter a symbol name less than 10 chars")
                return 
             }
             nftdetails.symbol=inputText;
             stage=3;
             await handleStage(ctx,null,next);

         }else {
            message1=await ctx.reply("Please enter a symbol for your NFT (max 10 characters)", {
                reply_markup:{
                    inline_keyboard :[
                        [
                            {text:"Goback" ,callback_data:"Back"},
                            { text: "❌ Cancel", callback_data: "cancel" }
                        ]
                    ]
                }
            })
         }
         break ;

         case 3:
              if(inputText){
             if(inputText.length > 200){
                await ctx.reply("Keep the NFT description less than 200 chars")
                return 
             }
             nftdetails.description=inputText;
             stage=4;
             await handleStage(ctx,null,next);

         }else {
            message1=await ctx.reply("Please keep the NFT description under 200 characters", {
                reply_markup:{
                    inline_keyboard :[
                        [
                            {text:"Goback" ,callback_data:"Back"},
                            { text: "❌ Cancel", callback_data: "cancel" }
                        ]
                    ]
                }
            })
         }

         break ;

       case 4 :
          if(inputText){
            if(inputText.toLowerCase()=='skip'){
                nftdetails.collectibleId="";
                stage=5;
            }else {
                if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(inputText)){
                    await ctx.reply("Please enter a valid Solana public key or type 'skip' ");
                    return;
                }else {
                    nftdetails.collectibleId=inputText;
                    stage=5;
                }
            } 
            await handleStage(ctx,null,next);
         }else {
            message1=await ctx.reply("Enter a collectible id for your NFT", {
                reply_markup:{
                    inline_keyboard :[
                        [
                            {text:"Goback" ,callback_data:"Back"},
                            { text: "❌ Cancel", callback_data: "cancel" }
                        ]
                    ]
                }
            })
         }     
         break;

      case 5: 
        if(inputText){
             if(isValidUrl(inputText)){
                await ctx.reply("Please enter a valid URL for the image");
                return;
             }
             nftdetails.imgUrl=inputText;
             const confirm=await WalletDeduction({nftReg:true},ctx,nftdetails);
             if(confirm){
                stage=1;
                await ctx.reply("Success we got metadata");
                next();
             }else if(!confirm){
                stage=1;
                next();
                isMetalist=false;
                isPhotolist=false;
             }
         }else {
            message5=await ctx.reply("Upload your NFT", {
                reply_markup:{
                    inline_keyboard :[
                         [{ text: "📸 Image", callback_data: "imgUp" }],
                         [{ text: "🌐 URL of Image", callback_data: "urlUp" }],
                         [{ text: "⬅️ Go Back", callback_data: "goBack" }, { text: "❌ Cancel", callback_data: "cancel" }]
                    ]
                }
            })
         }     
         break;
   
   
        }

}
 
let  confirmMessage:Message

 export async function getNFTmetadata(ctx:Context){
       confirmMessage=await ctx.reply("Are you ready to create your nft collection ",{
        reply_markup:{
            inline_keyboard:[
                [{
                    text:"Yes Lets Go 🚀 " ,callback_data:"YesCreateNFT"
                },{
                    text:"No, not now ",
                    callback_data:"NoDontCreateNFT"
                }]
            ]

        }
    })


    bot.action("NoDontCreateNFT",ctx =>{
       
        ctx.reply("Alright ")
        ctx.answerCbQuery("ok")
    })


    bot.action("YesCreateNFT",async(str,next)=>{
        str.deleteMessage(confirmMessage.message_id);
        await str.reply("Important ! Please do not use")
        await str.answerCbQuery("Lets start");
         isMetalist=true;
        await handleStage(str,null,next)
    });

      bot.action("imgUp", async (ctx) => {
        ctx.deleteMessage(message5!.message_id);
         await ctx.reply(`${WARNING_MESSAGE_IMAGE_UPLOAD} 😊`);
        isPhotolist = true;
        await ctx.answerCbQuery();
    });

    bot.action("urlUp", async (ctx) => {
        ctx.deleteMessage(message5!.message_id);
        await ctx.reply("Please enter the image URL 🌐");
         isPhotolist = false;
        stage = 5;
        await ctx.answerCbQuery();
    });

     bot.on(message("photo"),async (ctx,next)=>{
     if(!isMetalist || !isPhotolist){
        return next();
     }


    const ImageUrl=await uploadImagePermUrl(ctx);

    if(ImageUrl){
        ctx.reply("Here is your image link ");
        ctx.reply(`[click to open in browwser](${ImageUrl.ipfsUrl})`,{parse_mode:"MarkdownV2"});
        ctx.reply(`\`${ImageUrl.ipfsUrl } \``,{parse_mode:"MarkdownV2"} )
        nftdetails.imgUrl=ImageUrl.ipfsUrl[0];
        const isConfirmed=await WalletDeduction({
            nftReg:true
        },ctx,nftdetails);

        if(isConfirmed){
            stage=1;
            await ctx.reply("metadata with your image is all set ")
        }
        isMetalist=false;
        isPhotolist=false;
   
    }
    });

    bot.on(message("text"),async (ctx,next)=>{
        if(!isMetalist){
            return next();
        }

        const intputtext=ctx.message.text;
        await handleStage(ctx,intputtext,next)
    })

    bot.action("cancel",async (ctx)=>{
        await cancelProcess(ctx);
        await ctx.answerCbQuery("Procces cancelled ")
    })

    bot.action("Back",async(ctx,next)=>{

    const mesgtodelete=[message1,message2,message3,message4,message5]
        for(let i=0;i<mesgtodelete.length ;i++){

             if(stage===i+1 && mesgtodelete[i]){
                ctx.deleteMessage(mesgtodelete[i]!.message_id)
            }
        }
        await goBack(ctx,next);
        await ctx.answerCbQuery("going back")

    }
      

)
 }
