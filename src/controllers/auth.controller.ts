import { UserService } from "../services/user.service";
import { CreateUserDTO, LoginUserDTO } from "../dtos/user.dto";
import { Request, Response } from "express";
import z from "zod";
import { deleteFile, getFilePath } from "../config/multer.config";
import { IUser } from "../models/user.model";

let userService = new UserService();
export class AuthController {
    async register(req: Request, res: Response) {
        try {
            console.log(req.body)
            const parsedData = CreateUserDTO.safeParse(req.body); 
            if (!parsedData.success) { // validation failed
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }
            const userData: CreateUserDTO = parsedData.data;
            const newUser = await userService.createUser(userData);
            return res.status(201).json(
                { success: true, message: "User Created", data: newUser }
            );
        } catch (error: Error | any) { // exception handling
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async login(req: Request, res: Response) {
        try {
            const parsedData = LoginUserDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }
            const loginData: LoginUserDTO = parsedData.data;
            const { token, user } = await userService.loginUser(loginData);
            return res.status(200).json(
                { success: true, message: "Login successful", data: user, token }
            );

        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    /**
     * PUT /api/auth/:id
     * Update authenticated user profile with optional image upload
     */
    async updateProfile(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Verify that user is updating their own profile
            if (req.user && req.user._id.toString() !== id && req.user.role !== 'admin') {
                if (req.file) deleteFile(req.file.filename);
                return res.status(403).json(
                    { success: false, message: "Forbidden: Cannot update other user's profile" }
                );
            }

            if (!id) {
                if (req.file) deleteFile(req.file.filename);
                return res.status(400).json(
                    { success: false, message: "User ID is required" }
                );
            }

            // Get existing user
            const existingUser = await userService.getUserById(id);
            if (!existingUser) {
                if (req.file) deleteFile(req.file.filename);
                return res.status(404).json(
                    { success: false, message: "User not found" }
                );
            }

            // Prepare update data
            const updateData: Partial<IUser> = {};

            // Only include fields that are provided
            if (req.body.email) updateData.email = req.body.email;
            if (req.body.fullName) updateData.fullName = req.body.fullName;
            if (req.body.password) updateData.password = req.body.password;

            // Handle image update
            if (req.file) {
                // Delete old image if it exists
                if (existingUser.image) {
                    const oldFilename = existingUser.image.split('/').pop();
                    if (oldFilename) deleteFile(oldFilename);
                }
                updateData.image = getFilePath(req.file.filename);
            }

            const updatedUser = await userService.updateUser(id, updateData);

            return res.status(200).json(
                { success: true, message: "Profile updated successfully", data: updatedUser }
            );
        } catch (error: Error | any) {
            if (req.file) deleteFile(req.file.filename);
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}