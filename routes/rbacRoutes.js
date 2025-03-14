const express = require("express");
const requireAuth = require("../middleware/authMiddleware");
const SubUser = require("../models/subUserModel")
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const { sendSubUserCredentials } = require("../helpers/emailTemplates");
const { transport } = require("../config/mailerTransport");

const routes = express.Router();
routes.use(requireAuth)
const grantUserAccess = async (req, res) => {
    try {
        const email = req.body.email;
        const role = req.body.role;
        const _id = req.params.userId;

        const password = otpGenerator.generate(8, {
            digits: true,
            lowerCaseAlphabets: true,
            upperCaseAlphabets: true,
            specialChars: true,
        });


        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(password, salt);

        const user = await SubUser.create({
            userEmail: email,
            role,
            password,
            userId: _id
        })

        transport.sendMail(
            sendSubUserCredentials(
                email,
                password,
                role
            ),
            async (error, info) => {
                if (error) {
                    throw new Error(error);
                } else {
                    console.log("Email Sent");
                }
            }
        );

        res.status(201).json({
            success: true,
            message: "User created Successfully",
            email: email,
            password: password,
            role
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            error
        })

    }
}

const getAllSubUsers = async (req, res) => {
    try {
        const userId = req.params.userId;

        const subUsers = await SubUser.find({ userId });

        if (subUsers.length === 0) {
            return res.status(404).json({ message: "No sub-users found for this userId." });
        }
        console.log(subUsers)
        res.status(200).json({ subUsers });
    } catch (error) {
        console.error("Error fetching sub-users:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

routes.get("/sub-users/:userId", getAllSubUsers);
routes.post("/grant-user-access/:userId", grantUserAccess);
module.exports = routes;