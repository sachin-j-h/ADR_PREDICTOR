// This is side effects schema

const mongoose = require('mongoose')

const sideeffectsSchema = new mongoose.Schema({
    sideeffectname: {
        type: String,
        required: true
    },
    sideeffectdescription: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("sideeffect", sideeffectsSchema)