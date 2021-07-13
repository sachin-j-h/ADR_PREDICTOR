// This is drugs schema

const mongoose = require('mongoose')


const drugSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    generic_name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    side_effects: [{
        type: Number,
        required: true,
        default: 0
    }],
})

module.exports = mongoose.model("drug", drugSchema)



