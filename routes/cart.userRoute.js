const router = require('express').Router();
const url = require('url');

// Load models
const User = require('../models/userModel');

router.post('/add', async (req, res) => {
    const { userId, item } = req.body
    var user = await User.findOne({ _id: userId })
    user.cart = [item, ...user.cart]
    await user.save()
    res.json({
        message: "item added to cart successfully"
    })
})


router.post('/get', async (req, res) => {
    const { userId, count } = req.body
    let limit = 5
    let skip = (count * limit) - limit  
    var user = await User.findOne({ _id: userId }, { cart: { $slice: [skip, limit] } })
    res.json({
        cart: user.cart
    })
})

router.post('/set', async (req, res) => {
    const { userId, cart } = req.body
    var user = await User.findOne({ _id: userId })
    user.cart = cart
    await user.save()
    res.json({
        cart: user.cart
    })
})

module.exports = router
