import { clusterApiUrl, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";

import { createMint, ExtensionType, getMint, getMintLen, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

import { createMetadataAccountV3,  mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { createNoopSigner,publicKey as metaplexPubkey} from "@metaplex-foundation/umi";
import { toWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
import { getExplorerLink } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { convertToKeyPair } from "../wallet/wallet";
import { metaDataJsonUrl } from "../imageuploader/imagemetadata";
import prisma from "../../db";
import { connection } from "../../connection";
import { TokenInfo } from "./getmetadata";







const TOKEN_METADATA_PROGRAM_ID=new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
)

let tokenMint:PublicKey

const metaplex=createUmi(clusterApiUrl("devnet")).use(mplTokenMetadata())


export async function creatminttoken(tokenmetadata:TokenInfo,name:string){
    
    
    
    const user=await prisma.user.findUnique({
        where:{
            name:name
        }
    })

    


const mnemonic=user?.walletMnemonic;
const wallet=await convertToKeyPair(mnemonic!);

//json rpc
const result =await metaDataJsonUrl(tokenmetadata);
//we have url 
const metaurl=await result.ipfsUrl



const metadata = {
    name: tokenmetadata.tokenname, 
    symbol: tokenmetadata.symbol, 
    uri: metaurl,      //our url image 
    sellerFeeBasisPoints: 0, 
    creators: null, 
    collection: null, // Optional collection details
    uses: null // Optional usage restrictions
}

const mintlength=getMintLen([ExtensionType.MetadataPointer]);

const minimumReq=await connection.getMinimumBalanceForRentExemption(mintlength);

tokenMint=await createMint(connection,wallet.userkeypair!,new PublicKey(wallet.userpubkey),null,tokenmetadata.decimals);

const metadataPDAandbump=PublicKey.findProgramAddressSync([
    Buffer.from("metadata"),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    tokenMint.toBuffer()
],TOKEN_METADATA_PROGRAM_ID);


 const metadataPDA=metadataPDAandbump[0];

 const transaction=new Transaction();

const instructions=createMetadataAccountV3(metaplex,{
    mint: metaplexPubkey(tokenMint)   ,
    mintAuthority:createNoopSigner(metaplexPubkey(wallet.userkeypair.publicKey)),
    metadata:metaplexPubkey(metadataPDA),
    isMutable:true,
    payer:createNoopSigner(metaplexPubkey(wallet.userkeypair.publicKey)),
    updateAuthority:metaplexPubkey(wallet.userkeypair.publicKey),
    collectionDetails:null,
    data:metadata,
},
).getInstructions()

const web3instruction=toWeb3JsInstruction(instructions[0]);

transaction.add(web3instruction)


const transactionSignatue=await sendAndConfirmTransaction(
    connection,
    transaction,
    [wallet.userkeypair]
)

console.log(`transaction signature ${transactionSignatue}`)
const link=getExplorerLink("address",tokenMint.toString(),'devnet')

return  {link,minimumReq}

}



export async function  mintToken(tokenpubkey:PublicKey,mintamount:number,decimals:number,Userpub?:PublicKey,name?:string){

    const user=await prisma.user.findUnique({
        where:{
            name:name
        }
    })
   
const mnemonic=user?.walletMnemonic;
const wallet=await convertToKeyPair(mnemonic!);

const tokeninfo=await getMint(connection,tokenpubkey)

try {
    const tokenaccount=await getOrCreateAssociatedTokenAccount(
        connection,
        wallet.userkeypair,
        tokenpubkey,
         Userpub || new PublicKey(wallet.userpubkey)
    )


    const tokeninSmallest=Math.pow(10,tokeninfo.decimals);

    const mintTransactionSignature=await mintTo(
        connection,
        wallet.userkeypair,
        tokenpubkey,
        tokenaccount.address,
        new PublicKey(wallet.userpubkey),
        mintamount * tokeninSmallest,
        
    )
    return  true;
} catch (error) {
     return false;
}

}