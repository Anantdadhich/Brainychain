export const MINT_TOKEN_DESTINATION_MSG = "💰 Where's the party? Specify the destination address:";

export const INSUFFICIENT_BALANCE_MSG = "⚠️ Need more SOL! Airdrop some to:";

export const ENTER_PUBLIC_KEY_MSG = "🔗 Send it to who? Enter the public key:";

export const ENTER_MINT_AMOUNT_MSG = "💸 How much to mint? Enter the amount:";

export const INVALID_PUBLIC_KEY_MSG = "❌ Invalid key! Enter a valid base58 string.";

export const INVALID_AMOUNT_MSG = "❌ Invalid amount! Enter a positive number.";

export const MINT_SUCCESS_MSG = (tokenName:string, pubKey:string) => `🎉 You did it! ${tokenName} minted to ${pubKey}!`;

export const MINT_ERROR_MSG = (tokenName:string) => `⚠️ Mint failed! Check your inputs and try again for ${tokenName}.`;

export const MINTING_PROCESS_ERROR_MSG = "⚠️ Something went wrong! Try minting again.";

export const WARNING_MESSAGE_IMAGE_UPLOAD = `⚠️ Image Upload Warning ⚠️

**File Size Limit:** 5 MB max.

**Why the limit?** Larger files can degrade image quality and impact NFT minting or token utility.

**Keep it lean for a seamless experience!**`;

