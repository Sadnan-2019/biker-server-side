const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { application } = require("express");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tcqfzoc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJwt(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "unauthorixation access" });
  }
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    // console.log(decoded.foo) // bar
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();

    const toolsCollection = client.db("bike_tools").collection("tools");
    const orderCollection = client.db("bike_tools").collection("orders");
    const usersCollection = client.db("bike_tools").collection("users");

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.get("/users", verifyJwt, async (req, res) => {
      const query = {};
      const cursor = usersCollection.find(query);
      const users = await cursor.toArray();
      res.send(users);
    });

    app.put("/user/admin/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const accountRequester = await usersCollection.findOne({
        email: requester,
      });
      if (accountRequester.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        return res.status(403).send({ message: "forbidden" });
      }
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send({ result, token });
    });

    app.post("/orders", async (req, res) => {
      const orders = req.body;
      const result = await orderCollection.insertOne(orders);
      res.send(result);
    });

    app.get("/order", verifyJwt, async (req, res) => {
      const customer = req.query.customerEmail;
      // console.log("auth",authorization)
      const decodedEmail = req.decoded.email;
      if (customer === decodedEmail) {
        const query = { customerEmail: customer };
        const order = await orderCollection.find(query).toArray();
        return res.send(order);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });

    app.get("/manage-orders", async (req, res) => {
      const query = {};
      const cursor = orderCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/tools", async (req, res) => {
      const newTool = req.body;
      const result = await toolsCollection.insertOne(newTool);
      res.send(result);
    });
    app.delete("/delete-tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/tools", async (req, res) => {
      const query = {};
      const cursor = toolsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/purchase/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const tool = await toolsCollection.findOne(query);
      res.send(tool);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello  grom toolsfetcure World!");
});

app.listen(port, () => {
  console.log(`toolsfetcure app listening on port ${port}`);
});
