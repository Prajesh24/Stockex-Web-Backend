import { Request, Response } from "express";
import { UserService } from "../../services/user.service";
import { CreateUserDTO } from "../../dtos/user.dto";
import z from "zod";
import { IUser } from "../../models/user.model";
import { deleteFile, getFilePath } from "../../config/multer.config";

let userService = new UserService();

export class AdminController {
    /**
     * POST /api/admin/users
     * Create a new user with optional image upload
     */
    async createUser(req: Request, res: Response) {
        try {
            // Validate body data (without image field since it's in file)
            const createUserData = {
                email: req.body.email,
                password: req.body.password,
                fullName: req.body.fullName,
                confirmPassword: req.body.confirmPassword,
            };

            const parsedData = CreateUserDTO.safeParse(createUserData);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                );
            }

            const userData: any = parsedData.data;

            // Add image path if file was uploaded
            if (req.file) {
                userData.image = getFilePath(req.file.filename);
            }

            // Set role from body if provided, otherwise defaults to 'user'
            if (req.body.role && ['user', 'admin'].includes(req.body.role)) {
                userData.role = req.body.role;
            }

            const newUser = await userService.createUser(userData);

            return res.status(201).json(
                { success: true, message: "User created successfully", data: newUser }
            );
        } catch (error: Error | any) {
            // Delete uploaded file if creation fails
            if (req.file) {
                deleteFile(req.file.filename);
            }
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    /**
     * GET /api/admin/users
     * Retrieve all users
     */
    async getAllUsers(req: Request, res: Response) {
        try {
            const users = await userService.getAllUsers();
            return res.status(200).json(
                { success: true, message: "Users retrieved successfully", data: users }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    /**
     * GET /api/admin/users/:id
     * Retrieve a specific user by ID
     */
    async getUserById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json(
                    { success: false, message: "User ID is required" }
                );
            }

            const user = await userService.getUserById(id);

            if (!user) {
                return res.status(404).json(
                    { success: false, message: "User not found" }
                );
            }

            return res.status(200).json(
                { success: true, message: "User retrieved successfully", data: user }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    /**
     * PUT /api/admin/users/:id
     * Update a user with optional image upload
     */
    async updateUser(req: Request, res: Response) {
        try {
            const { id } = req.params;

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
            if (req.body.role && ['user', 'admin'].includes(req.body.role)) {
                updateData.role = req.body.role;
            }

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
                { success: true, message: "User updated successfully", data: updatedUser }
            );
        } catch (error: Error | any) {
            if (req.file) deleteFile(req.file.filename);
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    /**
     * DELETE /api/admin/users/:id
     * Delete a user
     */
    async deleteUser(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json(
                    { success: false, message: "User ID is required" }
                );
            }

            // Get user to delete their image
            const user = await userService.getUserById(id);
            if (!user) {
                return res.status(404).json(
                    { success: false, message: "User not found" }
                );
            }

            // Delete user image if it exists
            if (user.image) {
                const filename = user.image.split('/').pop();
                if (filename) deleteFile(filename);
            }

            const result = await userService.deleteUser(id);

            if (!result) {
                return res.status(500).json(
                    { success: false, message: "Failed to delete user" }
                );
            }

            return res.status(200).json(
                { success: true, message: "User deleted successfully" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}
