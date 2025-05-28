import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import axios from "axios"
import { generateMnemonic, mnemonicToSeedSync } from "bip39"
import { derivePath } from "ed25519-hd-key";
import path from "path"
import prisma from "../../db";
import { connection } from "../../connection";







export async function convertToKeyPair(mnemonic:string){
   try {
    const masterseed=mnemonicToSeedSync(mnemonic);
    const derivedseed=derivePath("m/44'/501'/0'/0'", masterseed.toString("hex")).key
    const userkeypair=Keypair.fromSeed(derivedseed)
    const userpubkey=userkeypair.publicKey.toBase58();
    return ({mnemonic,userkeypair,userpubkey})
   } catch (error) {
     throw error
   }
} 


export async function WalletGenerate(name:string){
    try {
         const mnemonic=generateMnemonic();
         const wallet=await convertToKeyPair(mnemonic)
           //convert unitarray to base64 key
   const secretkeyBase64=Buffer.from(wallet.userkeypair.secretKey).toString("base64")

         await prisma.user.update({
            where:{
                name:name
            },
            data:{
                walletSecretkey:secretkeyBase64,
                walletMnemonic:mnemonic,
                walletaddress:wallet.userpubkey
            }
         });
    } catch (error) {
        console.log("error",error)
        throw error;
    }
}

export async function balanceFromWallet(userPubkey:PublicKey):Promise<number>  {
    try {
        const balance=await connection.getBalance(userPubkey);
        return balance;
    } catch (error) {
      console.log("Error getting wallet balance",error)
      return 0;  
    }
}

export const warningMessage = `
**⚠️ Critical Warning: Handle with Extreme Care ⚠️**

**Revealing your private key exposes your wallet to severe risks.**

* **Unauthorized Access:** Anyone with your private key can steal your funds.
* **Irreversible Loss:** Once compromised, your assets may be permanently lost.

**Proceed with utmost caution. Ensure your device and environment are secure.**
`;






