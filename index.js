const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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

async function run() {
  try {
    await client.connect();

    const toolsCollection = client.db("bike_tools").collection("tools");


    app.post("/tools",async(req,res)=>{
      const newTool = req.body;
      const result = await toolsCollection.insertOne(newTool)
      res.send(result);


    })


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
