import { createUmi, generateSigner, keypairIdentity, percentAmount } from "@metaplex-foundation/umi";
import prisma from "../../db"
import { convertToKeyPair } from "../wallet/wallet.js";
import { clusterApiUrl,type Cluster } from "@solana/web3.js";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { ExtensionType, getMintLen } from "@solana/spl-token";
import { connection } from "../..";
import metaDataJsonUrl from "../imageuploader/imagemetadata.js";
import { getExplorerLink } from "@solana-developers/helpers";



export interface NFTdetails{
tokenname:string,
symbol:string,
description:string,
imgUrl:any,
collectbleid?:string,
traits?:string
}

export default async function CreateNFTcollec(nftdetails:NFTdetails,name:string){
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
        throw new Error("user wallet  not found ")
       }  

       const wallet=await convertToKeyPair(mnemonic);
             //@ts-ignore
       const metaplex=createUmi(clusterApiUrl("devnet") as Cluster);
       const umikeypair=metaplex.eddsa.createKeypairFromSecretKey(wallet.userkeypair.secretKey)

       metaplex.use(keypairIdentity(umikeypair))  //middleware 
       .use(mplTokenMetadata())
       .use(irysUploader())
     
    const mintlength=getMintLen([ExtensionType.MetadataPointer]);

    const minimumRequired=await connection.getMinimumBalanceForRentExemption(mintlength);


    async function jsonURL(){
        const data:NFTdetails={
            tokenname:nftdetails.tokenname,
            symbol:nftdetails.symbol,
            description:nftdetails.description,
            imgUrl:nftdetails.imgUrl

        }

        const  result=await metaDataJsonUrl(data)
        return await result.ipfsUrl
    }


      const uri=await jsonURL();

   const collectionmint=generateSigner(metaplex)

   await createNft(metaplex,{
    mint:collectionmint,
    name:nftdetails.tokenname,
    uri,
    updateAuthority:metaplex.identity.publicKey,
    sellerFeeBasisPoints:percentAmount(1),
    isCollection:true
   }).sendAndConfirm(metaplex , {
    send:{
        commitment:"finalized"
    }
   })


   const link=getExplorerLink(
    "address",
    collectionmint.publicKey,
    "devnet"
   )


   return {link ,minimumRequired}
     } 
     catch (error) {
      console.error("Error in createNFT",error)
      if(error instanceof Error && error.message==="user not"){
        throw new Error("user not found");
      }
      throw new Error("Failed To create nft collection")
     }
}