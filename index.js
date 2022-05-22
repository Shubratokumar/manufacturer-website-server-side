// Product Manufacturer Server setup
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');

// middleware
app.use(cors())
app.use(express.json())

// Database Connection


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ger5y.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  console.log("accessing form DB")
  client.close();
});


// server testing
app.get('/', (req, res)=>{
    res.send("Product Manufacturer server is running")
})

app.listen(port, ()=>{
    console.log(`Product Manufacturer server is listening from the port no : ${port}`)
})