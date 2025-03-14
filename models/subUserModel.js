const mongoose = require("mongoose");

const subUserSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        userEmail: { type: String, required: true, unique: true },
        role: { type: String, required: true },
        password: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("subuser", subUserSchema);
