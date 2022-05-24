// Product Manufacturer Server setup
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();

// middleware
app.use(cors())
app.use(express.json())


// Database Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ger5y.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("productManufacturer").collection("products");
    const reviewsCollection = client.db("productManufacturer").collection("reviews");

    // Load all products
    app.get("/products", async(req, res)=>{
      const products = await productCollection.find().toArray();
      res.send(products);
    })
    // Load all reviews
    app.get("/reviews", async(req,res)=>{
      const reviews = await reviewsCollection.find().toArray();
      res.send(reviews);
    })
  } finally {

  }
}
run().catch(console.dir);


// server testing
app.get('/', (req, res)=>{
    res.send("Product Manufacturer server is running")
})

app.listen(port, ()=>{
    console.log(`Product Manufacturer server is listening from the port no : ${port}`)
})