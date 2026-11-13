const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config.env") });
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config({ path: path.join(__dirname, ".env.local") });

const connectDB = async()=>{
    if (!process.env.MONGODB_URI) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("MONGODB_URI is required in production.");
        }
        console.warn("MONGODB_URI is not configured; product management will use local file storage.");
        return;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected.");
}

module.exports=connectDB;
