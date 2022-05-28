// Product Manufacturer Server setup
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


// middleware
app.use(cors());
app.use(express.json());

// Database Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ger5y.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// jwt verify middleware
function verifyJWT(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "Unauthorized acccess." });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access." });
    }
    req.decoded = decoded;
    next();
  });
}
async function run() {
  try {
    await client.connect();
    const productCollection = client
      .db("productManufacturer")
      .collection("products");
    const orderCollection = client
      .db("productManufacturer")
      .collection("orders");
    const reviewsCollection = client
      .db("productManufacturer")
      .collection("reviews");
    const usersCollection = client
      .db("productManufacturer")
      .collection("users");
    const paymentCollection = client
      .db("productManufacturer")
      .collection("payment");

    // middleware 
    const verifyAdmin = async (req, res, next) => {
      const requesterEmail = req.decoded.email;
      const requesterAccount = await usersCollection.findOne({
        email: requesterEmail,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "Forbidden Access" });
      }
    };

    // Load all products
    app.get("/products", async (req, res) => {
      const products = await productCollection.find().toArray();
      res.send(products);
    });

    // insert new product 
    app.post("/product", verifyJWT, verifyAdmin, async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });

    // Load specific product by query
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });

    // update product quantity
    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateQuantity = {
        $set: {
          quantity: data.quantity,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updateQuantity,
        options
      );
      res.send(result);
    });

    // delete a product
    app.delete("/products/:id", async(req, res)=>{
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    // create payment intent for client secret
    app.post("/create-payment-intent", verifyJWT, async(req, res)=>{
      const order = req.body;
      const price = order.price;
      const amount = price * 100;
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types : [ "card" ],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    })

    // patch : update order info
    app.patch('/order/:id', verifyJWT, async(req,res)=>{
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId : payment.transactionId,
          shipped : false,
        } 
      }
      const result = await paymentCollection.insertOne(payment);
      const updateOrder = await orderCollection.updateOne(filter, updatedDoc);
      res.send(updateOrder);
    })

    // update order status
    app.put('/order/:id', verifyJWT, verifyAdmin, async(req,res)=>{
      const id = req.params.id;
      const orderStatus = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          shipped : true,
          shippedOrderId : orderStatus.shippedOrderId,
        } 
      }
      const updateOrder = await orderCollection.updateOne(filter, updatedDoc, options);
      res.send(updateOrder);
    })

    // load all user
    app.get("/user", verifyJWT, async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });

    // Delete a user
    app.delete('/user/:email', verifyJWT, async(req,res)=>{
      const email = req.params.email;
      const query = {email : email};
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })

    // Load Admin
    app.get("/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    // Make admin role
    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // user load by email
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateUser = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateUser,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1d",
        }
      );
      res.send({ result, token });
    });

    // get all orders
    app.get("/orders", verifyJWT, async(req,res)=>{
      const orders = await orderCollection.find().toArray();
      res.send(orders);
    })

    // load specific order for payment
    app.get('/order/:id', verifyJWT, async(req,res)=>{
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await orderCollection.findOne(query);
      res.send(order);
    })

    // new order
    app.post("/order", async (req, res) => {
      const orders = req.body;
      const result = await orderCollection.insertOne(orders);
      res.send(result);
    });

    // get orders by email
    app.get("/order", verifyJWT, async (req, res) => {
      const userEmail = req.query.userEmail;
      const decodedEmail = req.decoded.email;
      if (userEmail === decodedEmail) {
        const query = { userEmail };
        const orders = await orderCollection.find(query).toArray();
        return res.send(orders);
      } else {
        return res.status(403).send({ message: "Forbidden access." });
      }
    });

    // Delete order by admin
    app.delete('/order/:id', verifyJWT, verifyAdmin, async(req,res)=>{
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    })

    // Load all reviews
    app.get("/reviews", async (req, res) => {
      const reviews = await reviewsCollection.find().toArray();
      res.send(reviews);
    });

    // post a review
    app.post('/reviews', verifyJWT, async(req,res)=>{
      const orders = req.body;
      const result = await reviewsCollection.insertOne(orders);
      res.send(result);
    })
  } finally {
  }
}
run().catch(console.dir);

// server testing
app.get("/", (req, res) => {
  res.send("Product Manufacturer server is running");
});

app.listen(port, () => {
  console.log(
    `Product Manufacturer server is listening from the port no : ${port}`
  );
});
