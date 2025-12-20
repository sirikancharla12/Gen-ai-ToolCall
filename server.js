import express from "express";
import { generate } from "./chatBot.js";
import cors from "cors";
const app=express();
const port=3000;

app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173"
}));

app.get("/",(req,res)=>{
    res.send("Hello");
})

app.post("/chat",async (req,res)=>{
const {message,threadID}=req.body;

if(!message || !threadID){
    return res.status(400).json({error:"message and threadID are required"});
}
console.log("message received:",message);
const result=await generate(message,threadID);
res.json({message:result});
})

app.listen(port,()=>{
    console.log(`port is listening on ${port}`)
})