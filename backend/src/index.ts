require("dotenv")
import express, { json } from "express"
import cors from  "cors"
import jwt from  "jsonwebtoken"
import bs58 from  "bs58"
import { clusterApiUrl, Connection } from "@solana/web3.js"


const app=express()
app.use(express.json())  //middleware 
app.use(cors())    // used for heaadeers auth
const JWT_SECERET="123456"

export const connection=new Connection(clusterApiUrl("devnet"));


app.post("/api/v1/signup",(req,res)=>{

    res.json({

    })
})


app.post("/api/v1/signin",(req,res)=>{

    res.json({
        
    })
})


app.post("/api/v1/txn/sig",(req,res)=>{

    res.json({
        
    })
})


app.get("/api/v1/txn",(req,res)=>{

    res.json({
        
    })
})
