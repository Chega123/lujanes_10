const UserModel = require('../model/user.model');
const jwt = require("jsonwebtoken");

class UserService {
    static async registerUser(name, email, password, profileImage) {
        try {
            const createUser = new UserModel({ name, email, password, profileImage });
            return await createUser.save();
        } catch (err) {
            throw err;
        }
    }

    static async getUserByEmail(email) {
        try {
            return await UserModel.findOne({ email });
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    static async checkUser(email) {
        try {
            return await UserModel.findOne({ email });
        } catch (error) {
            throw error;
        }
    }

    static async updateUser(userId, updateData) {
        try {
            return await UserModel.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            );
        } catch (error) {
            throw error;
        }
    }

    static async getUserById(userId) {
        try {
            return await UserModel.findById(userId).select("-password");
        } catch (error) {
            throw error;
        }
    }
    static async generateAccessToken(tokenData, JWTSecret_Key, JWT_EXPIRE) {
        return jwt.sign(tokenData, JWTSecret_Key, { expiresIn: JWT_EXPIRE });
    }
}

module.exports = UserService;