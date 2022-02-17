const mongoose = require("mongoose");
const db_url = process.env.DB_URI;

mongoose.connect(db_url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useNewUrlParser: true
});