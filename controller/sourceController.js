const Source = require("../models/sourceModel");

const getSource = async (req, res) => {
    try {
        const sources = await Source.find({});
        res.status(200).json({
            sources,
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Server error'
        });
    }
};

const addSource = async (req, res) => {
    const { source, label, value } = req.body;

    try {
        const existingSource = await Source.findOne({ value });

        if (existingSource) {
            res.status(201).json({
                message: "Source selected successfully",
                source: existingSource,
            });

        }

        else {
            const newSource = new Source({
                source,
                label,
                value,
            });

            await newSource.save();

            res.status(201).json({
                message: "Source added successfully",
                source: newSource,
            });
        }

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Server error',
            message: error.message, // Optionally include more details
        });
    }
};


module.exports = {
    getSource,
    addSource,
};
