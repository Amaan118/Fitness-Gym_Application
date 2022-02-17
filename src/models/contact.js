const mongoose = require("mongoose");
const validator = require("validator");

// Create an Schema for the Database
const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 2
    },
    age: {
        type: Number,
        required: true
    },
    contact: {
        type: String,
        required: true,
        minlength: 10,
    },
    email: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Please provide a valid Email.')
            }
        }
    },
    address: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    }
});

// Compile that Schema into Model
const Contact = mongoose.model("Contact", contactSchema, "feedbacks");

module.exports = Contact;