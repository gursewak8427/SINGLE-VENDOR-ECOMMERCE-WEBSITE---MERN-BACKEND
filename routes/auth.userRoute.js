const router = require('express').Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const url = require('url');
const UserAuth = require('../helpers/checkAuth')
// Load models
const User = require('../models/userModel');

// Get User with user Id

router.get('/userDetails/:userId', async (req, res) => {
    var user = await User.findOne({ _id: req.params.userId })
    if (user) {
        res.json({
            user
        })
    } else {
        res.status(400).json({
            message: "User Not Found"
        })
    }
})



router.post('/userSignup', async (req, res) => {
    const { name, number, password } = req.body
    var user = await User.findOne({ phone: req.body.number })
    if (user) {
        res.status(400).json({
            error: "Number Already exist. Please Login"
        })
    } else {

        // let new_id = await User.countDocuments()
        // new_id += 1

        user = new User({
            // _id: new_id,
            name,
            phone: number,
            password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user = await user.save();

        const token = jwt.sign(
            { id: user._id, name: user.name, phone: user.phone },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone
            }
        });
    }
})

router.post('/userForget', async (req, res) => {
    const { number, newPassword } = req.body
    var user = await User.findOne({ phone: number })
    if (!user) {
        res.status(400).json({
            error: "Number doesn't exist"
        })
    } else {
        user.password = newPassword
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user = await user.save();

        res.json({
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone
            }
        });
    }
})

router.post('/userCheck', async (req, res) => {
    var user = await User.findOne({ phone: req.body.number })
    if (user) {
        res.status(400).json({
            error: "This number is already exist. Please Login"
        })
    } else {
        res.json({
            message: "Successfull"
        })
    }
})

router.post('/userSignin', async (req, res) => {
    const { phone, password } = req.body
    var user = await User.findOne({ phone: req.body.phone })
    if (!user) {
        res.status(400).json({
            error: "This number is not exist. Please Register First"
        })
    } else {
        bcrypt.compare(req.body.password, user.password, (err, result) => {
            if (err) {
                return res.status(400).json({
                    error: 'Something went wrong in password hashing'
                })
            } else if (result) {
                const token = jwt.sign(
                    { id: user._id, name: user.name, phone: user.phone },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );
                res.json({
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        phone: user.phone
                    }
                });
            }
            else {
                return res.status(400).json({
                    error: 'Passwords don\'t match'
                })
            }
        })
    }
})

router.post('/updateProfile/general', async (req, res) => {
    const { userId, uname } = req.body
    var user = await User.findOne({ _id: userId })
    if (user) {
        user.name = uname
        let data = await user.save()
        return res.json({
            message: "Profile Updated Successfull"
        })
    }
})

router.post('/updateProfile/security/checkPassword', async (req, res) => {
    const { userId, password } = req.body
    var user = await User.findOne({ _id: userId })
    if (user) {
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return res.status(400).json({
                    error: 'Something went wrong in password hashing'
                })
            } else if (result) {
                return res.json({
                    message: 'Successfully Validate Password'
                })
            }
            else {
                return res.status(400).json({
                    error: 'Passwords don\'t match'
                })
            }
        })
    }
})


router.post('/updateProfile/security/updatePassword', async (req, res) => {
    const { userId, password } = req.body
    var user = await User.findOne({ _id: userId })
    if (user) {
        user.password = password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user = await user.save();
        return res.json({
            message: "Password Updated Successfull"
        })
    }
})

router.post('/ratingCheckProduct', async (req, res) => {
    const { product, userId } = req.body
    var user = await User.findOne({ _id: userId })
    var myProduct = await Product.findOne({ _id: product._id })
    var havee = false
    user.orders.map(order => {
        return order.orderStatus == 4 ? (
            order.items.map(item => item.id == myProduct._id ? havee = true : null)
        ) : null
    })
    if (havee) {
        return res.json({
            message: "Ok, You purchased this product."
        })
    } else {
        return res.status(401).json({
            error: "You havn't purchase this product."
        })
    }
})

router.post('/setRating', async (req, res) => {
    const { product, userId, rating } = req.body
    var myProduct = await Product.findOne({ _id: product._id })
    myUser = await User.findOne({ _id: userId })
    const newRating = {
        userId: myUser.name,
        rate: rating.rate,
        review: rating.review
    }
    console.log(req.body, newRating)
    myProduct.productReviews = [newRating, ...myProduct.productReviews]
    myProduct.totalRate = myProduct.totalRate + parseFloat(rating.rate)
    myProduct.save();
    return res.json({
        message: "Successfull"
    })
})

router.post('/checkUserToken', UserAuth, async (req, res) => {
    console.log("im here bro")
    res.json({
        user: req.userData
    })
})



module.exports = router
