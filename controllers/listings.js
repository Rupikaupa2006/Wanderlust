const Listing = require("../models/listing");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({
    accessToken: mapToken
});


// ---------------- INDEX ----------------

module.exports.index = async (req, res) => {

    const alllistings = await Listing.find({});

    res.render("listings/index.ejs", {
        alllistings
    });

};


// ---------------- NEW FORM ----------------

module.exports.renderNewForm = (req, res) => {

    res.render("listings/new.ejs");

};


// ---------------- SHOW ----------------

module.exports.showListing = async (req, res) => {

    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        })
        .populate("owner");

    if (!listing) {

        req.flash(
            "error",
            "Listing you requested for does not exist!"
        );

        return res.redirect("/listing");
    }


    res.render("listings/show.ejs", {
        listing
    });

};


// ---------------- CREATE ----------------

module.exports.createListing = async (req, res) => {

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;


    // ---------------- GEOCODING ----------------

    let response = await geocodingClient
        .forwardGeocode({
            query: req.body.listing.location,
            limit: 1
        })
        .send();

    console.log(response.body.features);


    // Save coordinates in listing

    if (response.body.features.length > 0) {

        newListing.geometry =
            response.body.features[0].geometry;

    }


    // ---------------- IMAGE ----------------

    if (req.file) {

        newListing.image = {
            filename: req.file.filename,
            url: req.file.path
        };

    }


    // ---------------- SAVE ----------------

    let savedListing = await newListing.save();

    console.log(savedListing);

    req.flash(
        "success",
        "New Listing Created!"
    );

    res.redirect("/listing");

};


// ---------------- EDIT FORM ----------------

module.exports.renderEditForm = async (req, res) => {

    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {

        req.flash(
            "error",
            "Listing you requested for does not exist!"
        );

        return res.redirect("/listing");
    }

    res.render("listings/edit.ejs", {
        listing
    });

};


// ---------------- UPDATE ----------------

module.exports.updateListing = async (req, res) => {

    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {

        req.flash(
            "error",
            "Listing you requested for does not exist!"
        );

        return res.redirect("/listing");
    }


    // Update normal listing details

    Object.assign(
        listing,
        req.body.listing
    );


    // ---------------- GEOCODING ----------------

    let response = await geocodingClient
        .forwardGeocode({
            query: req.body.listing.location,
            limit: 1
        })
        .send();


    if (response.body.features.length > 0) {

        listing.geometry =
            response.body.features[0].geometry;

    }


    // ---------------- UPDATE IMAGE ----------------

    if (req.file) {

        listing.image = {
            filename: req.file.filename,
            url: req.file.path
        };

    }


    await listing.save();

    req.flash(
        "success",
        "Listing Updated!"
    );

    res.redirect(`/listing/${id}`);

};


// ---------------- DELETE ----------------

module.exports.destroyListing = async (req, res) => {

    let { id } = req.params;

    const deletedListing =
        await Listing.findByIdAndDelete(id);

    console.log(deletedListing);

    req.flash(
        "success",
        "Listing Deleted!"
    );

    res.redirect("/listing");

};