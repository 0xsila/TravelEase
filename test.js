const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://mhamdi:dWM0rWj5ILuca2f2@cluster0.sd5azyl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
  } catch (e) {
    console.error("Connection failed:", e);
  } finally {
    await client.close();
  }
}

run();
