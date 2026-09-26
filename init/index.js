const mongoose = require("mongoose");

const data = require("./data.js");

const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(() => {
        console.log("connected to database");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});

    data.data = data.data.map((obj) => ({ ...obj, owner: "6ab1bc55f43632f14a3d1a9a" }));
    await Listing.insertMany(data.data);

    console.log("Database initialized with sample data");
};

initDB();