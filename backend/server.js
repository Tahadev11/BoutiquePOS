require("dotenv").config();

const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
    try {
        await client.connect();
        console.log("MongoDB connected successfully!");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

connectDB();