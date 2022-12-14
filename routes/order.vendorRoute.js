const router = require('express').Router();
const url = require('url');

// Load models
const User = require('../models/userModel');
const Vendor = require('../models/vendorModel');
const sendEmail = require('./sendEmail');


// Constants for email
const ORDER_PLACED_FOR_USER = "ORDER_PLACED_FOR_USER" // "order placed by user"
const ORDER_PLACED_FOR_VENDOR = "ORDER_PLACED_FOR_VENDOR" // "order placed by vendor"
const ORDER_PENDING = "ORDER_PENDING" // "order pending again start by vendor"
const ORDER_PROCESSING = "ORDER_PROCESSING" // "order processing start by vendor"
const ORDER_SHIPPING = "ORDER_SHIPPING" // "order is going to shipping by vendor"
const ORDER_CANCELED = "ORDER_CANCELED" // "order canceled by vendor"
const ORDER_DELIVERED = "ORDER_DELIVERED" // "order successfully delivered by vendor"


router.post('/get', async (req, res) => {
    const { userId, count } = req.body
    let limit = 5
    let skip = (count * limit) - limit
    var vendor = await Vendor.findOne({ _id: userId }, { orders: { $slice: [skip, limit] } })
    res.json({
        orders: vendor.orders
    })
})


// Get Single Order Full Details with OrderId
router.get('/order_details/:orderIndex', async (req, res) => {
    const { orderIndex } = req.params
    console.log("order Detail fetching...")
    var vendor = await Vendor.findOne({ _id: "1" })
    var order = vendor.orders[orderIndex]
    res.json({
        order
    })
})

// router.post('/set', async (req, res) => {
//     const { userId, cart } = req.body
//     var user = await User.findOne({ _id: userId })
//     user.cart = cart
//     await user.save()
//     res.json({
//         cart: user.cart
//     })
// })

router.post('/changeStatus', async (req, res) => {
    const { userId, orders, time } = req.body

    var vendor = await Vendor.findOne({ _id: 1 })
    vendor.orders = orders
    await vendor.save()
    var user = await User.findOne({ _id: userId })
    res.json({
        usserOrders: user.orders,
        message: 'Status Change Successfully'
    })
})


router.post('/changeStatus/user', async (req, res) => {
    const { userId, orders, notify, orderIndex } = req.body
    console.log("Im here after changing status");
    var user = await User.findOne({ _id: userId })
    user.orders = orders
    const orderStatus = orders[0].orderStatus
    console.log("#orderStatus")
    console.log(orderStatus)
    if (orderStatus == 1) {
        sendEmail(req, ORDER_PENDING, user, orders[orderIndex], orderIndex);
    }
    if (orderStatus == 2) {
        sendEmail(req, ORDER_PROCESSING, user, orders[orderIndex], orderIndex);
    }
    if (orderStatus == 3) {
        sendEmail(req, ORDER_SHIPPING, user, orders[orderIndex], orderIndex);
    }
    if (orderStatus == 4) {
        sendEmail(req, ORDER_DELIVERED, user, orders[orderIndex], orderIndex);
    }
    if (orderStatus == 5) {
        sendEmail(req, ORDER_CANCELED, user, orders[orderIndex], orderIndex);
    }
    if (user?.notifications) {
        user.notifications = [notify, ...user.notifications]
    } else {
        user.notifications = [notify]
    }
    user.newNotification = user.newNotification + 1
    user.save()

    res.json({
        message: 'All Status Change Successfully'
    })
})


router.post('/setNewNotify', async (req, res) => {
    var vendor = await Vendor.findOne({ _id: 1 })
    vendor.newNotification = 0
    vendor.save()
    res.json({
        newNotify: vendor.newNotification
    })
})

router.post('/getNewNotify', async (req, res) => {
    let vendor = await Vendor.findOne({ _id: 1 })
    res.json({
        newNotify: vendor.newNotification
    })
})

module.exports = router
