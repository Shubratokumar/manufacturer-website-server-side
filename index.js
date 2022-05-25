// Product Manufacturer Server setup
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const orderCollection = client.db("productManufacturer").collection("orders");
    const reviewsCollection = client.db("productManufacturer").collection("reviews");
    const usersCollection = client.db("productManufacturer").collection("users");

    // Load all products
    app.get("/products", async(req, res)=>{
      const products = await productCollection.find().toArray();
      res.send(products);
    })

    // Load specific product by query
    app.get("/products/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await productCollection.findOne(query);
      res.send(result);
    })
    
    // update product quantity
    app.put("/products/:id", async(req, res)=>{
      const id = req.params.id;
      const data = req.body;
      const filter = {_id: ObjectId(id)};
      const options = { upsert: true };
      const  updateQuantity ={
          $set : {
              quantity : data.quantity,
          }
      };     
      const result = await productCollection.updateOne(filter, updateQuantity, options);
      res.send(result);
  })

  // order
  app.post("/order", async(req, res)=>{
    const orders = req.body;
    const result = await orderCollection.insertOne(orders);
    res.send(result);
  })

  // get ordres
  app.get("/order", async(req, res)=>{
    const userEmail = req.query.userEmail;
    const query = { userEmail }
    const orders = await orderCollection.find(query).toArray();
    res.send(orders);
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