import jwt from 'jsonwebtoken';

// Generates and returns a jwt token based on param: id
const generateToken = (email) => {

    // Token expires in 3 days
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '3d' });

    return token;
};

export { generateToken };