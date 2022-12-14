const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const cors = require("cors");

const connectDB = require('./config/db');
connectDB();

var allowedOrigins = ['http://localhost:3000',
    'https://single-vendor-ecommerce-website-mern.vercel.app',
    'https://ecommerce-backend-fffe.onrender.com'];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin 
        // (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));
// app.use(cors({ origin: true, credentials: true }));

app.use(express.json({ extended: false }));
app.use("/files", express.static("files")); //The folder where the files or uploads are located

const vendorRoutes = require('./routes/vendorRoutes')
const productRoutes = require('./routes/productRoutes')
const userAuthRoutes = require('./routes/auth.userRoute')
const userCartRoutes = require('./routes/cart.userRoute')
const userOrderRoutes = require('./routes/order.userRoute')
const vendorOrderRoutes = require('./routes/order.vendorRoute')
const generalRoute = require('./routes/generalRoute')
const searchRoute = require('./routes/searchRoute')
app.use('/api/user/auth/156', userAuthRoutes)
app.use('/api/user/cart/156', userCartRoutes)
app.use('/api/user/order/156', userOrderRoutes)
app.use('/api/user/', searchRoute)
app.use('/api/vendor/156', vendorRoutes)
app.use('/api/vendor/order/156', vendorOrderRoutes)
app.use('/api/vendor/product/156', productRoutes)
app.use('/api/vendor/general/156', generalRoute)

const port = process.env.PORT || 8084;
app.listen(port, () => console.log(`Server running on port ${port}`));