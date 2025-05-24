/*import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";
import { TokenInfo } from "../token/getmetadata";
import { NFTdetails } from "../nft/createnftcollection";
;

dotenv.config();

export default async function metaDataJsonUrl(tokenMetadata: TokenInfo | NFTdetails) {
    const data = {
        name: tokenMetadata.tokenname,
        symbol: tokenMetadata.symbol,
        description: tokenMetadata.description,
        image: tokenMetadata.imgUrl
    }

    const formData = new FormData();
    formData.append('file', JSON.stringify(data), {
        filename: 'metadata.json',
        contentType: 'application/json'
    });

    try {
        const response = await axios.post('https://api.pinata.cloud/v2/pinning/pinFileToIPFS', formData, {
            headers: {
                'pinata_api_key': process.env.PINATA_API_KEY,
                'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
                ...formData.getHeaders()
            }
        });

        const ipfsHash = response.data.IpfsHash;
        const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;

        return {
            ipfsHash: ipfsHash,
            ipfsUrl: ipfsUrl
        };
    } catch (error) {
        console.error('Pinata metadata upload error:', error);
        throw error;
    }
}*/
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.PINATA_JWT) {
  throw new Error("No Pinata JWT found");
}

export async function metaDataJsonUrl(metadata: object) {
  const formData = new FormData();
  formData.append("file", JSON.stringify(metadata), {
    filename: "metadata.json",
    contentType: "application/json",
  });

  try {
    const response = await axios.post("https://api.pinata.cloud/v3/files", formData, {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        ...formData.getHeaders(),
      },
    });

    const { cid } = response.data.data;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

    return {
      ipfsHash: cid,
      ipfsUrl,
    };
  } catch (error) {
    console.error("Pinata metadata upload error:", error);
    throw error;
  }
}
