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

router.post('/add', async (req, res) => {
    const { userId, order } = req.body
    var user = await User.findOne({ _id: userId })
    user.orders = [order, ...user.orders]
    // let newNotification = `Order Placed Successfully with order-ID : ${order.orderId} at ${order.orderTime[0]}`
    // if (user?.notifications) {
    //     user.notifications = [newNotification, ...user.notifications]
    // } else {
    //     user.notifications = [newNotification]
    // }
    // user.newNotification = user.newNotification + 1
    await user.save()

    // send email to user and vendor both
    // send email to user first

    sendEmail(req, ORDER_PLACED_FOR_USER, user, order);

    var vendor = await Vendor.findOne({ _id: 1 })
    vendor.orders = [[userId, order], ...vendor.orders]
    let newVendorNotification = `New Order with order-ID : ${order.orderId} at ${order.orderTime[0]}`
    if (vendor?.notifications) {
        vendor.notifications = [newVendorNotification, ...vendor.notifications]
    } else {
        vendor.notifications = [newVendorNotification]
    }
    vendor.newNotification = vendor.newNotification + 1
    await vendor.save()

    res.json({
        message: "order placed successfully",
        orders: user.orders
    })
})

router.post('/get', async (req, res) => {
    const { userId, count } = req.body
    let limit = 5
    let skip = (count * limit) - limit
    let user = await User.findOne({ _id: userId }, { orders: { $slice: [skip, limit] } })
    res.json({
        orders: user.orders
    })
})

router.post('/set', async (req, res) => {
    const { userId, cart } = req.body
    let user = await User.findOne({ _id: userId })
    user.cart = cart
    await user.save()
    res.json({
        cart: user.cart
    })
})

router.post('/getNewNotify', async (req, res) => {
    const { userId } = req.body
    let user = await User.findOne({ _id: userId })
    res.json({
        newNotify: user.newNotification
    })
})

router.post('/setNewNotify', async (req, res) => {
    const { userId } = req.body
    var user = await User.findOne({ _id: userId })
    user.newNotification = 0
    user.save()
    res.json({
        newNotify: user.newNotification
    })
})

router.post('/getNotify', async (req, res) => {
    const { count, userId } = req.body
    let limit = 5
    let skip = (count * limit) - limit
    var user = await User.findOne({ _id: userId }, { notifications: { $slice: [skip, limit] } })

    res.json({
        notify: user.notifications
    })
})

module.exports = router
