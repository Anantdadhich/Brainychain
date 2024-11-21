import axios from "axios";
import path, { dirname } from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import FormData from "form-data";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.PINATA_JWT) {
    throw Error("No Pinata JWT found")
}

export async function metadataImageUrl(buffer: Buffer) {
    const formData = new FormData();
    formData.append('file', buffer, {
        filename: 'image.png',
        contentType: 'image/png'
    });

    try {
        const uploadResponse = await axios.post('https://api.pinata.cloud/v2/pinning/pinFileToIPFS', formData, {
            headers: {
                'Authorization': `Bearer ${process.env.PINATA_JWT}`,
                ...formData.getHeaders()
            }
        });

       
        const ipfsHash = uploadResponse.data.IpfsHash;
        const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;

        return {
            ipfsHash: ipfsHash,
            ipfsUrl: ipfsUrl
        };
    } catch (error) {
        console.error('Pinata upload error:', error);
        throw error;
    }
}