const jwt = require("jsonwebtoken");
const User = require("../models/user_data");

const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies.mfg_cookie;
        if (token) {
            const verified = jwt.verify(token, process.env.SECRET_KEY);

            const user = await User.findById({ _id: verified });
            req.token = token;
            req.user = user;

            next();
        }
        else {
            throw new Error
        }
    } catch (err) {
        req.flash("fail", "Please Login to acccess this feature.");
        res.redirect("login");
    }
}

module.exports = authenticate;