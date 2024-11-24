import { message } from "telegraf/filters";

import axios from "axios";
import sharp from "sharp";
import { metadataImageUrl } from "./imageupload.js";
import dbMetricsUpdate, { getImage } from "../../db/function.js";
import { bot } from "../../telbot/bot.js";

export async function uploadImagePermUrl(ctx: any) {
    try {
        const files = ctx.update.message.photo[ctx.update.message.photo.length - 1].file_id;
        const filesInfo = ctx.update.message.photo[ctx.update.message.photo.length - 1];

        if (filesInfo!.file_size! > 5 * (Math.pow(10, 6))) {
            ctx.reply("Please upload an image smaller than 5 MB.");
            return;
        }

        const url = await ctx.telegram.getFileLink(files);
    
        const response = await axios({ url: String(url), responseType: 'arraybuffer' });
        const imgBuffer = Buffer.from(response.data);
    
        const processedImageBuffer = await sharp(imgBuffer)
            .resize({ width: 1024 }) 
            .jpeg({ quality: 80 }) 
            .toBuffer();
    
        const result = await metadataImageUrl(processedImageBuffer);
        await dbMetricsUpdate(String(ctx.from.username), { img: true });
        return result;
        
    } catch (error) {
        console.error("Error processing image:", error);
        ctx.reply("An error occurred while processing the image. Please try again.");
    }
}

export default function imageUpload() {
    try {
        bot.command("uploadtopinata", async (ctx:any) => {
            try {
                let imageUse = await getImage(String(ctx.from.username));

                if (imageUse === 0) {
                    ctx.reply("📸 Please send an image that is less than 5 MB.");
                    ctx.reply(`Note for Image Upload:
                    
        File Size Limit: Maximum 5 MB

        👇Important👇:

        Uploading larger files may lead to a loss of image resolution and affect your ⛏️ NFT minting ⛏️ or 🪙 token utility 🪙.
        For optimal quality and seamless integration with decentralized platforms, please ensure your images are within the specified size limit.

        🙏Thank you🙏!`);
                    
                    try {
                        bot.on(message("photo"), async (ctx:any) => {
                            try {
                                const result = await uploadImagePermUrl(ctx);
                            
                                if (result) {
                                    ctx.reply("Here is your image link");
                                    ctx.reply(`[Click to open in browser](${result.ipfsUrl})`, { parse_mode: 'MarkdownV2' });
                                    ctx.reply(`\`${result.ipfsUrl}\``, { parse_mode: 'MarkdownV2' });
                            
                                    await dbMetricsUpdate(String(ctx.from.username), { img: true });
                                } else {
                                    ctx.reply("Please try again later.");
                                }
                            } catch (error) {
                                console.error("Error handling photo message:", error);
                                ctx.reply("An error occurred while processing your photo. Please try again.");
                            }
                        })
                        
                    } catch (error) {
                        console.error("Error setting up photo listener:", error);
                    }
                } else if (imageUse! > 5){
                    ctx.reply("You have exceeded the maximum number of image uploads allowed.");
                }
            } catch (error) {
                console.error("Error in uploadToPinata command:", error);
                ctx.reply("An error occurred. Please try again later.");
            }
        })
    } catch (error) {
        console.error("Error setting up image upload command:", error);
    }
}