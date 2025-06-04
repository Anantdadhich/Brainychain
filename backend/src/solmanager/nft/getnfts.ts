import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { clusterApiUrl } from "@solana/web3.js";
import {
  fetchAllDigitalAssetWithTokenByOwner,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { keypairIdentity } from "@metaplex-foundation/umi";
import prisma from "../../db";
import { convertToKeyPair } from "../wallet/wallet";

export interface NFTInfo {
  name: string;
  symbol: string;
  uri: string;
  mint: string;
  updateAuthority: string;
}

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export async function getNFTs(username: string): Promise<NFTInfo[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { name: username },
    });

    if (!user) throw new Error("User not found");
    if (!user.walletMnemonic) throw new Error("User wallet not found");

    const wallet = await convertToKeyPair(user.walletMnemonic);
    const metaplex = createUmi(clusterApiUrl("devnet"));

    const umikeypair = metaplex.eddsa.createKeypairFromSecretKey(
      wallet.userkeypair.secretKey
    );

    metaplex.use(keypairIdentity(umikeypair)).use(mplTokenMetadata());

    const allNFTs = await fetchAllDigitalAssetWithTokenByOwner(
      metaplex,
      umikeypair.publicKey
    );

    console.log(`Found ${allNFTs.length} NFTs for the owner.`);

    const result: NFTInfo[] = allNFTs.map((nft, index) => {
      console.log(`\nNFT #${index + 1}:`);
      console.log("Mint Address:", nft.publicKey.toString());
      console.log("Name:", nft.metadata.name);
      console.log("Symbol:", nft.metadata.symbol);
      console.log("URI:", nft.metadata.uri);

      return {
        name: nft.metadata.name || "Unknown",
        symbol: nft.metadata.symbol || "N/A",
        uri: nft.metadata.uri || "",
        mint: nft.publicKey.toString(),
        updateAuthority: nft.metadata.updateAuthority?.toString() || "",
      };
    });

    return result;
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    throw new Error("Failed to fetch NFTs");
  }
}
