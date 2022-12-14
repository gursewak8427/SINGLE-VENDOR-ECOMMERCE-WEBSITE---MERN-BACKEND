const mongoose = require('mongoose');

const GeneralSchema = new mongoose.Schema({
    _id: {
        type: Number,
    },
    CodPaymentOption: Boolean,
    mainSlider: [{
        name: String,
        link: String,
        image: [String],
        index: String
    }],
});

module.exports = General = mongoose.model('general', GeneralSchema);