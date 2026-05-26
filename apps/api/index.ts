import express from "express"
const app = express();
import {prismaClient } from "store";

app.post('/wesite',(req,res)=>{

})

app.get("/status/:websiteId",(req,res)=>{
    
})
app.listen(process.env.PORT || 3000);
