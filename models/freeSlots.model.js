const mongoose = require("mongoose");

const freeSlotsSchema = new mongoose.Schema({
    candidateId: {
        type: String,
    },
    jobId: {
        type: String,
    },
    startTime: {
        type: Object,
    },
    endTime: {
        type: Object,
    },
    workTimeStart: {
        type: String
    },
    workTimeEnd: {
        type: String
    },
    email: {
        type: String,
    },
    interviewerEmail: {
        type: String,
    },
    schedules: {
        type: Array,
        default: [],
    },

    interviewers: {
        type: Array,
        default: [],
    },

    duration: {
        type: Number,
    },
});

module.exports = mongoose.model("freeslots", freeSlotsSchema);