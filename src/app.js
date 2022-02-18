require("dotenv").config("../");
const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const nodemailer = require("nodemailer");
const cookie_parser = require("cookie-parser");
const bcrypt = require("bcryptjs");

const auth = require("./middleware/authenticate");
const User = require("./models/user_data");
const Contact = require("./models/contact");

const app = express();
const port = process.env.PORT || 80;

require("./db/connect");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookie_parser());

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));
app.use(flash());


app.use(function (req, res, next) {
    res.locals.messages = require("express-messages")(req, res);
    next();
});


const viewPath = path.join(__dirname, "../views");
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));
app.set("views", viewPath);
app.set("view engine", "pug");


app.use(function authenticate_user(req, res, next) {
    const token = req.cookies.mfg_cookie;
    if (token) {
        res.locals.isAuthenticated = true;
    }
    else {
        res.locals.isAuthenticated = false;
    }
    next();
});


let details = {
    customer: "Jane Mallice",
    email: "jane@mallice.com",
    plan: "Premium",
    price: 10000,
    features: []
};

const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_FEEDBACK,
        pass: process.env.PASSWORD
    }
});


app.get("/", (req, res) => {
    res.status(200).render("home");
});


app.get("/home", (req, res) => {
    res.status(200).render("home");
});


app.get("/about", (req, res) => {
    res.status(200).render("about");
});


app.get("/contact", (req, res) => {
    res.status(200).render("contact");
});


app.post("/contact", async (req, res) => {
    try {
        const feedback = Contact(req.body);
        await feedback.save();

        mail_data = {
            from: `${req.body.email}`,
            to: process.env.RECIEVER,
            subject: `MFG feedback by ${req.body.name} aged ${req.body.age}`,
            text: `Message : ${req.body.mail_data} \nContact Number : ${req.body.contact} \nAddress : ${req.body.address} \nfrom : ${req.body.email}`
        };

        await transport.sendMail(mail_data);

        req.flash("success", "Thanks for the Feedback. We will reach out to you soon!");
        res.redirect("/contact");

    } catch (err) {
        console.log(err);
        req.flash("fail", "Server was unable to send email. Please try again after sometime.");
        res.redirect("/contact");
    }
});


app.get("/buy", (req, res) => {
    res.status(200).render("buy");
});


app.post("/buy", auth, async (req, res) => {
    details.customer = req.user.username;
    details.email = req.user.email;
    details.plan = req.query.plan.toUpperCase();
    details.price = req.query.price;

    if (req.query.plan == "novice") {
        details["features"] = ["Full Body Workouts", "Access to 75% Gym Equipments", "Diet Plan free for 1 Month"];
    }
    else if (req.query.plan == "amateur") {
        details["features"] = ["Full Body Workouts", "Access to All Gym Equipments", "Diet Plan free for 6 Month"];
    }
    else if (req.query.plan == "pro") {
        details["features"] = ["Full Body Workouts", "Access to All Gym Equipments", "Diet Plan free for 12 Month", "Personal Trainer"];
    }

    res.status(201).render("purchase_form", { details: details });
});


app.get("/purchase", (req, res) => {
    res.status(200).render("purchase_form", { details: details });
});


app.post("/purchase", auth, async (req, res) => {
    try {
        const customer = req.user;

        customer.purchase_data = customer.purchase_data.concat({
            name: req.body.name,
            contact: req.body.contact,
            email: req.body.email,
            address: req.body.address,
            payment_method: req.body.payment_method,
            price: req.body.price,
            pack: req.body.pack
        });
        await customer.save();

        req.flash("success", `Thank ${req.user.username} you for the Purchase. You will recieve the order soon!`);
        res.redirect("/purchase");

    } catch (err) {
        req.flash("fail", `${err.toString()}`);
        res.redirect("/purchase");
    }
});


app.get("/purchase_history", auth, (req, res) => {
    let notEmpty = true;
    if (Object.keys(req.user.purchase_data).length === 0) {
        notEmpty = false;
    }
    res.status(200).render("purchased", { user: req.user, data: req.user.purchase_data, notEmpty: notEmpty });
});


app.post("/purchase_history", auth, async (req, res) => {
    try {
        if (Object.keys(req.user.purchase_data).length === 0) {
            throw new Error("No Purchase history found ! You broke af!!")
        }

        req.user.purchase_data = [];
        await req.user.save();

        req.flash("info", "Deleted Purchase History !! ");
        res.redirect("/purchase_history");
    } catch (err) {
        req.flash("fail", `${err.toString()}`);
        res.redirect("/purchase_history");
    }

});


app.get("/register", (req, res) => {
    res.status(200).render("register");
});


app.post("/register", async (req, res) => {
    try {
        if (req.body.password === req.body.confirm_pass) {
            const user_to_register = User(req.body);

            await user_to_register.save();

            const token = await user_to_register.generateAuthToken();
            res.cookie("mfg_cookie", token, {
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                httpOnly: true
            });

            req.flash("success", `Hello ${req.body.username}. Welcome to Magic Fitness Gym's Elites!!`);
            res.redirect("/home");
        }

        else {
            throw new Error("Password Does Not Match!");
        }

    } catch (err) {
        if (err.code === 11000) {
            let unique = `${Object.keys(err.keyPattern)[0].toUpperCase()} already in use. Please try with different one.`
            req.flash("info", `${unique}`);
            res.redirect("/register");
        }
        else {
            req.flash("info", `${err.toString()}`);
            res.redirect("/register");
        }
    }
});


app.get("/login", (req, res) => {
    res.status(200).render("login");
});


app.post("/login", async (req, res) => {
    try {
        if (res.locals.isAuthenticated) {
            req.flash("info", "Already logged in.");
            res.redirect("/home");
        }
        else {
            const user = await User.findOne({ username: req.body.username });
            if (user && await bcrypt.compare(req.body.password, user.password)) {
                const token = await user.generateAuthToken();

                res.cookie("mfg_cookie", token, {
                    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    httpOnly: true
                });

                req.flash("success", `Welcome Back ${user.username}`);
                res.redirect("/home");
            }
            else {
                throw new Error("Invalid Login Credentials.");
            }
        }
    } catch (err) {
        req.flash("fail", `${err.toString()}`);
        res.redirect("/login");
    }
});


app.get("/end_session", auth, async (req, res) => {
    try {
        if (req.token) {
            res.clearCookie("mfg_cookie");

            req.user.tokens = req.user.tokens.filter((current_token) => {
                return current_token !== req.token;
            });
            await req.user.save();

            req.flash("success", `Logged Out from ${req.user.username}`);
            res.redirect("/login");
        }
        else {
            throw new Error("Login to access this feature.");
        }
    } catch (err) {
        req.flash("fail", "Login to access this feature.");
        res.redirect("/login");
    }
});


app.get("*", (req, res) => {
    res.status(404).render("page_not_found");
});


app.listen(port, () => {
    console.log(`Server started at port ${port}`);
});
