// Product Manufacturer Server setup
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');

// middleware
app.use(cors())
app.use(express.json())

// server testing
app.get('/', (req, res)=>{
    res.send("Product Manufacturer server is running")
})

app.listen(port, ()=>{
    console.log(`Product Manufacturer server is listening from the port no : ${port}`)
})