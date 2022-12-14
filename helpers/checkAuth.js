const jwt = require("jsonwebtoken");
const UserAuth = (req, res, next) => {
    console.log("CHekcing token...");
    try {
        const token = req.headers.authorization.split(" ")[1];
        console.log(token);
        const decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        req.userData = {
            phone: decodedToken.phone,
            id: decodedToken.id,
            name: decodedToken.name
        };
        console.log("token")
        console.log(token)
        next();
    } catch (error) {
        console.log(error)
        res.status(401).json({ message: "Auth failed!" });
    }
};

module.exports = UserAuth