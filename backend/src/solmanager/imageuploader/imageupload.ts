/*import axios from "axios";
import path, { dirname } from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import FormData from "form-data";


dotenv.config()


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
}*/

import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.PINATA_JWT) {
  throw new Error("No Pinata JWT found");
}

export async function metadataImageUrl(buffer: Buffer) {
  const formData = new FormData();
  formData.append("file", buffer, {
    filename: "image.png",
    contentType: "image/png",
  });

  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          ...formData.getHeaders(),
        },
      }
    );

    const { IpfsHash } = response.data;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${IpfsHash}`;

    return {
      ipfsHash: IpfsHash,
      ipfsUrl,
    };
  } catch (error) {
    console.error("Pinata upload error:", error);
    throw error;
  }
}

