if(process.env.NODE_ENV!="production"){
require('dotenv').config();
}

const express = require("express");
const app = express();

const mongoose = require("mongoose");
const Listing = require("./models/listing.js");

const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const ExpressError = require("./utils/ExpressError.js");
const session=require("express-session");
const {MongoStore} = require("connect-mongo");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

const listings = require("./routes/listing");
const reviews= require("./routes/review");
const userRouter=require("./routes/user.js");

// ---------------- DATABASE ----------------

//const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl=process.env.ATLASDB_URL;
main()
    .then(() => {
        console.log("connected to database");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(dbUrl);
}


// ---------------- APP CONFIGURATION ----------------

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "public")));

const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
});

store.on("error", (err) => {
    console.log("ERROR IN MONGO SESSION STORE", err);
});

const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    },
};

// app.get("/", (req, res) => {
//     res.send("Hii, I am root");
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
});

// ---------------- DEMO USER-----------//
app.get("/demoUser",async(req,res)=>{
    let fakeUser=new User({
        username:"demoUser",
        email:"demouser@example.com"
});
  let registeredUser=await User.register(fakeUser,"demopassword");
  res.send(registeredUser);
})



app.use("/listing",listings);

app.use("/listing/:id/reviews",reviews);
app.use("/",userRouter);

// ---------------- TEST LISTING ROUTE ----------------

app.get(
    "/testListing",
    async (req, res) => {

        let sampleListing = new Listing({

            title: "My new Villa",

            description: "By the beach",

            price: 1200,

            location: "Goa",

            country: "India"

        });

        await sampleListing.save();

        console.log("Sample listing created!");

        res.send("Successful testing");
    }
);
app.get("/", (req, res) => {
    res.redirect("/listing");
});

// 404 handler
app.use((req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});

// Error handler
app.use((err, req, res, next) => {
    console.log("🔥 ACTUAL ERROR:", err);

    const {
        statusCode = 500,
        message = "Something went wrong"
    } = err;

    res.status(statusCode).render("error.ejs", { message });
});
// ---------------- SERVER ----------------

app.listen(8080, () => {

    console.log("server is listening to port 8080");

});