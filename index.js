// Product Manufacturer Server setup
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
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

// jwt verify middleware
function verifyJWT (req,res,next){
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({message: "Unauthorized acccess."});
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
    if(err){
      return res.status(403).send({message: "Forbidden access."})
    }
    req.decoded = decoded;
    next()
  })
}
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
    });

    // load all user
    app.get("/user",verifyJWT, async(req, res)=>{
       const users = await usersCollection.find().toArray();
       res.send(users);
    })
    // Make admin role
    app.put('/user/admin/:eamil', async(req,res)=>{
      const email = req.params.email;
      const filter = {email : email};
      const updateUser = {
        $set : {role : "admin"},
      }
      const result = await usersCollection.updateOne(filter, updateUser);
      res.send(result);
    })

    // user load by email
    app.put("/user/:email", async(req, res)=>{
      const email = req.params.email;
      const user = req.body;
      const filter = {email : email};
      const options = { upsert: true };
      const updateUser = {
            $set : user
      };
      const result = await usersCollection.updateOne(filter, updateUser, options);
      const token = jwt.sign({email : email}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn : '1d'
      })
      res.send({result, token});
    })

  // new order
  app.post("/order", async(req, res)=>{
    const orders = req.body;
    const result = await orderCollection.insertOne(orders);
    res.send(result);
  })

  // get orders
  app.get("/order", verifyJWT, async(req, res)=>{
    const userEmail = req.query.userEmail;
    const decodedEmail = req.decoded.email;
    if(userEmail === decodedEmail){
      const query = { userEmail };
      const orders = await orderCollection.find(query).toArray();
      return res.send(orders);
    } else {
      return res.status(403).send({message: "Forbidden access."});
    }
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