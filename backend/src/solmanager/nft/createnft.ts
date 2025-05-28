import {  generateSigner, keypairIdentity, percentAmount } from "@metaplex-foundation/umi";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { ExtensionType, getMintLen } from "@solana/spl-token";


import { getExplorerLink } from "@solana-developers/helpers";
import prisma from "../../db";
import { NFTdetails } from "./createnftcollection";
import { convertToKeyPair } from "../wallet/wallet";

import { metaDataJsonUrl } from "../imageuploader/imagemetadata";
import { connection } from "../../connection";





export async function CreateNFT(nftdetails:NFTdetails,name:string){

try {
    const user=await prisma.user.findUnique({
            where:{
                name:name
            }
         })

       if(!user){
        throw new Error("user not found ")
       } 


       const mnemonic=user.walletMnemonic;

       if(!mnemonic){
           throw new Error(" not found ")
       }

    const wallet = await convertToKeyPair(mnemonic);

     
      
      const metaplex=createUmi(connection)

     const umikeypair=metaplex.eddsa.createKeypairFromSecretKey(wallet.userkeypair.secretKey)

     metaplex.use(keypairIdentity(umikeypair))  //using the wallet keypair
     .use(mplTokenMetadata())    //handle nft metadata
     .use(irysUploader())  //uploading nft to ipfs
   //we are miniting the token  aand calculate the minimu sol  balance
   const mintlength=getMintLen([ExtensionType.MetadataPointer]);
 
   const mintRequired=await connection.getMinimumBalanceForRentExemption(mintlength)
    
//uplowaad metaa data to ipfs
   async function jsonUrl(){
    const data:NFTdetails ={   //creats  a json objects with nft details 
        tokenname:nftdetails.tokenname,
        symbol:nftdetails.symbol,
        description:nftdetails.description,
        imgUrl:nftdetails.imgUrl,
        collectbleid:nftdetails.collectbleid || ""
    }
    //herw wwe return the ipfs url for daata
    const result=await metaDataJsonUrl(data);
    return await result.ipfsUrl
   }


    const uri=await jsonUrl();
    const mint=generateSigner(metaplex);

    //create nft and mint 
    await createNft(metaplex,{
        mint,
        name:nftdetails.tokenname,
        symbol:nftdetails.symbol,
        uri,
        updateAuthority:metaplex.identity.publicKey,
        sellerFeeBasisPoints:percentAmount(1),
    }).sendAndConfirm(metaplex,
        {send:{
            commitment:"finalized"
        }}
    )
   
     let link=getExplorerLink("address",mint.publicKey,"devnet")
     
     return {link,mintRequired} 

} catch (error) {
  if (error instanceof Error) {
            if (error.message === "User not found") {
                throw new Error("No user found with the provided username");
            }
            if (error.message === "No wallet found for user") {
                throw new Error("User does not have a wallet configured");
            }
        }
        console.error("Error creating NFT:", error);
        throw new Error("Failed to create NFT. Please try again later.");
    
}

}