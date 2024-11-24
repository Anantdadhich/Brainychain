import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import  express , { Express,Request,Response }  from "express";
import dotenv from "dotenv"
import { Prisma, PrismaClient } from "@prisma/client";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import botCommands from "./telbot/bot";

const __filename=fileURLToPath(import.meta.url);
const __dirname=dirname(__filename)

dotenv.config({path:resolve(__dirname,"../.env")});


if(!process.env.DATABASE_URL){
    throw Error("no databse connect")
}

const primsa =new PrismaClient();

export const app:Express=express()

const port=3000;

export const connection=new  Connection(clusterApiUrl("devnet")) 

app.get("/",async (req:Request,res:Response)=>{ 

    try {
        const users=await primsa.user.findMany();
        res.status(200).json({message:"he",users})
    } catch (error) {
         console.error("Error fetching data:", error);
        res.status(500).send("Internal Server Error");
    }
}) 
    

botCommands()

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
