const jwt = require('jsonwebtoken')

const generateWebToken = (user) => {
    return jwt.sign(
        {id: user.id, email:user.email},
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES }
    );
};

module.exports = generateWebToken;
