const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const date = new Date(Date.now());

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        validate(value) {
            if (value.length < 2) {
                throw new Error("Username should be minimum of 2 charcaters.")
            }
        }
    },
    email: {
        type: String,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Please provide a valid Email Address.")
            }
        }
    },
    age: {
        type: Number,
        validate(value) {
            if (value < 13) {
                throw new Error("The Minimum age to join MFG is 13.")
            }
        }
    },
    height: {
        type: Number,
        validate(value) {
            if (value <= 0) {
                throw new Error("Height cannot be negative.")
            }
        }
    },
    weight: {
        type: Number,
        validate(value) {
            if (value <= 0) {
                throw new Error("Weight cannot be negative.")
            }
        }
    },
    bmi: {
        type: Number
    },
    contact: {
        type: String,
        validate(value) {
            if (value.length < 10) {
                throw new Error("Please provide a valid contact number.")
            }
        }
    },
    password: {
        type: String,
        validate(value) {
            if (value.length < 3) {
                throw new Error("Minimum Password length is 3.")
            }
        }
    },
    purchase_data: [{
        name: String,
        contact: String,
        email: String,
        address: String,
        payment_method: String,
        price: Number,
        pack: String,
        date: {
            type: Date,
            default: date.toDateString()
        }
    }],
    tokens: [{
    }]
});

userSchema.methods.generateAuthToken = async function () {
    try {
        const token = jwt.sign(this._id.toString(), process.env.SECRET_KEY);
        this.tokens = this.tokens.concat(token);
        await this.save();
        return token;
    } catch (err) {
        throw new Error(err)
    }
}

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 4);
    };
    next();
})

const User = mongoose.model("mfg_user_data", userSchema, "mfg_user_data");

module.exports = User;