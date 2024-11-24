import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";
import { NFTdetails } from "../nft/createnftcollection";
import { TokenInfo } from "../token/getmetadata";

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
}