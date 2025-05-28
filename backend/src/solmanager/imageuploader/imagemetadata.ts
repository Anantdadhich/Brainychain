
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
    console.error("Pinata metadata upload error:", error);
    throw error;
  }
}
