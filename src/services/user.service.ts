import { CreateUserDTO, LoginUserDTO } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import  bcryptjs from "bcryptjs"
import { HttpError } from "../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { IUser } from "../models/user.model";

let userRepository = new UserRepository();

export class UserService {
    async createUser(data: CreateUserDTO | any){
        // business logic before creating user
        const emailCheck = await userRepository.getUserByEmail(data.email);
        if(emailCheck){
            throw new HttpError(403, "Email already in use");
        }
        // const usernameCheck = await userRepository.getUserByUsername(data.username);
        // if(usernameCheck){
        //     throw new HttpError(403, "Username already in use");
        // }
        // hash password
        const hashedPassword = await bcryptjs.hash(data.password, 10); // 10 - complexity
        data.password = hashedPassword;

        // create user
        const newUser = await userRepository.createUser(data);
        return newUser;
    }

    async loginUser(data: LoginUserDTO){
        const user =  await userRepository.getUserByEmail(data.email);
        if(!user){
            throw new HttpError(404, "User not found");
        }
        // compare password
        const validPassword = await bcryptjs.compare(data.password, user.password);
        // plaintext, hashed
        if(!validPassword){
            throw new HttpError(401, "Invalid credentials");
        }
        // generate jwt
        const payload = { // user identifier
            id: user._id,
            email: user.email,
            // username: user.username,
            fullName: user.fullName,
            role: user.role
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }); // 30 days
        return { token, user }
    }

    async getUserById(id: string): Promise<IUser | null> {
        return await userRepository.getUserById(id);
    }

    async getAllUsers(): Promise<IUser[]> {
        return await userRepository.getAllUsers();
    }

    async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
        // If password is being updated, hash it
        if (updateData.password) {
            updateData.password = await bcryptjs.hash(updateData.password, 10);
        }
        
        // Check if email is being updated and if it's already in use
        if (updateData.email) {
            const existingUser = await userRepository.getUserByEmail(updateData.email);
            if (existingUser && existingUser._id.toString() !== id) {
                throw new HttpError(403, "Email already in use");
            }
        }

        return await userRepository.updateUser(id, updateData);
    }

    async deleteUser(id: string): Promise<boolean> {
        return await userRepository.deleteUser(id);
    }
}