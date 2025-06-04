import { PublicKey } from "@solana/web3.js";

import { Message } from "telegraf/types";
import { bot } from "../../telbot/bot";
import prisma from "../../db";
import { balanceFromWallet, convertToKeyPair } from "../wallet/wallet";
import { INSUFFICIENT_BALANCE_MSG } from "../token/tokenmessage";
import { getNFTCollectionmetadata } from "./getnftcollection";
import { getNFTmetadata } from "./getnft";
import { getNFTs } from "./getnfts";

let optionMessage: Message;

export default async function createNFTcommands() {
    bot.command("create_nft", async ctx => {
        const user = await prisma.user.findUnique({
            where: {
                name: ctx.from.username
            }
        });

        if (!user) {
            await ctx.reply("❌ No user found!");
            return;
        }

        const mnemonic = user.walletMnemonic;
        if (!mnemonic) {
            await ctx.reply("🔐 No wallet found!");
            return;
        }

        const wallet = await convertToKeyPair(mnemonic);

        try {
            const balance = await balanceFromWallet(new PublicKey(wallet.userpubkey));
            if (balance === 0) {
                ctx.reply(`⚠️ ${INSUFFICIENT_BALANCE_MSG}`);
                setTimeout(() => ctx.reply(
                    `\`${wallet.userpubkey}\``, {
                        parse_mode: "MarkdownV2"
                    }
                ), 1000);
                return;
            }

        } catch (error) {
            ctx.reply("⚠️ Couldn't fetch balance, please try again later.");
            setTimeout(() => ctx.reply(
                `\`${wallet.userpubkey}\``, {
                    parse_mode: "MarkdownV2"
                }
            ), 1000);
            return;
        }

        optionMessage = await ctx.reply("🎨 What type of NFT would you like to create?", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🖼️ Create Collectible", callback_data: "startCollectible" }],
                    [{ text: "📄 Create Regular NFT", callback_data: "createNFT" }]
                ]
            }
        });

        bot.action("startcollectiable", async ctx => {
            try {
                ctx.deleteMessage(optionMessage.message_id);
                await getNFTCollectionmetadata(ctx);
                ctx.answerCbQuery("✅ Connected to collectible creation");
            } catch (error) {
                console.error(error);
                ctx.reply("❌ An error occurred while creating the collectible. Please try again.");
            }
        });

        bot.action("createNFT", async ctx => {
            try {
                ctx.deleteMessage(optionMessage.message_id);
                ctx.answerCbQuery("✅ Connecting with NFT creation...");
                await getNFTmetadata(ctx);
            } catch (error) {
                console.error(error);
                ctx.reply("❌ An error occurred while creating the NFT. Please try again.");
            }
        });
    });

    bot.command("getnfts", async ctx => {
        try {
            const username = ctx.from.username;
            if (!username) {
                await ctx.reply("❌ Please set a username in your Telegram profile to use this command.");
                return;
            }

            await ctx.reply("🔍 Fetching your NFTs...");
            const nfts = await getNFTs(username);

            if (nfts.length === 0) {
                await ctx.reply("📭 You don't have any NFTs in your wallet.");
                return;
            }

            
            const chunkSize = 5;
            for (let i = 0; i < nfts.length; i += chunkSize) {
                const chunk = nfts.slice(i, i + chunkSize);
                const message = chunk.map((nft, index) => 
                    `NFT #${i + index + 1}:\n` +
                    `Name: ${nft.name}\n` +
                    `Symbol: ${nft.symbol}\n` +
                    `Mint: \`${nft.mint}\`\n` +
                    `View: [Open in Explorer](https://explorer.solana.com/address/${nft.mint}?cluster=devnet)\n`
                ).join('\n');

                await ctx.reply(message, {
                    parse_mode: "Markdown"
                });
            }

            await ctx.reply(`✅ Found ${nfts.length} NFTs in your wallet!`);
        } catch (error) {
            console.error("Error in getnfts command:", error);
            await ctx.reply("❌ Failed to fetch your NFTs. Please try again later.");
        }
    });
}
