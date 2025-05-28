import { fileURLToPath } from "url";
import express, { Request, Response } from "express";
import { dirname, resolve } from "path";
import { PrismaClient } from "@prisma/client";
import botCommands, { bot } from "./telbot/bot";


import dotenv from "dotenv"

dotenv.config()


const requiredEnvVars = ['DATABASE_URL', 'BOT_TOKEN', 'WEBHOOK_URL'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;




app.use(express.json());



app.get("/", async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.status(200).json({ message: "Server is running", users });
        return
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Internal Server Error" });
        
    }
});

// Webhook endpoint for Telegram
// to run    ngrok http 3000
app.post(`/webhook/${process.env.BOT_TOKEN}`, express.raw({ type: 'application/json' }), (req: Request, res: Response) => {
    try {
        bot.handleUpdate(req.body);
        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.sendStatus(500);
    }
});


botCommands();


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Webhook URL: ${process.env.WEBHOOK_URL}`);
});
