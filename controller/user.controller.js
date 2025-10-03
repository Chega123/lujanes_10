const UserService = require('../services/user.services');
const path = require('path');

exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        // Usar la URL de S3 si existe, sino usar imagen por defecto
        const profileImage = req.s3Url || 'https://your-bucket.s3.amazonaws.com/defaults/default_pfp.jpg';

        const successRes = await UserService.registerUser(name, email, password, profileImage);
        res.json({ status: true, message: "Usuario Registrado Correctamente" });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Error en el registro', error: error.message });
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new Error('Parámetros incorrectos');
        }
        let user = await UserService.checkUser(email);
        if (!user) {
            throw new Error('El usuario no existe');
        }
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            throw new Error('Usuario o contraseña incorrectos');
        }
        let tokenData = { _id: user._id, email: user.email };
        const token = await UserService.generateAccessToken(tokenData, "secret", "1h");
        res.status(200).json({
            status: true,
            success: "sendData",
            token: token,
            name: user.name,
            userId: user._id,
            profileImage: user.profileImage
        });
    } catch (error) {
        console.log(error, 'err---->');
        return res.status(400).json({ status: false, message: error.message });
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { name, email } = req.body;
        const profileImage = req.s3Url || null;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (profileImage) updateData.profileImage = profileImage;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ status: false, message: 'No se proporcionaron datos para actualizar' });
        }
        const updatedUser = await UserService.updateUser(userId, updateData);

        res.json({
            status: true,
            message: 'Usuario actualizado correctamente',
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                profileImage: updatedUser.profileImage,
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Error al actualizar usuario', error: error.message });
    }
};