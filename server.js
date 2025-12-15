import express from "express";

const app=express();
const port=3000;

app.use(express.json());
app.get("/",(req,res)=>{
    res.send("Hello");
})

app.post("/chat",(req,res)=>{
const {message}=req.body.json;
})

app.listen(port,()=>{
    console.log(`port is listening on ${port}`)
})