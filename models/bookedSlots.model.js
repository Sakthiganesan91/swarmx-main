const mongoose = require("mongoose");

const bookedSlotsSchema = new mongoose.Schema({
    candidateId: {
        type: String,
    },
    startTime: {
        type: Object,
    },
    endTime: {
        type: Object,
    },
    interviewerEmail: {
        type: String,
        required: true
    },
    meetId: {
        type: String,
        required: true
    },
    authentication: Object
});

module.exports = mongoose.model("bookedslots", bookedSlotsSchema);