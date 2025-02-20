const mongoose = require("mongoose");

const sourceSchema = new mongoose.Schema({
    source: {
        type: String,
    },
    label: {
        type: String,
    },
    value: {
        type: String,
    },
});

module.exports = mongoose.model("Source", sourceSchema);
