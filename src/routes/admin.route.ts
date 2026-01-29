import { Router } from "express";
import { AdminController } from "../controllers/admin/admin.controller";
import { authorizedMiddleware, adminMiddleware } from "../middlewears/middlewear";
import { uploadSingle } from "../config/multer.config";

let adminController = new AdminController();
const router = Router();

// Apply authorization and admin check middleware to all routes
router.use(authorizedMiddleware);
router.use(adminMiddleware);

// CRUD operations for users
router.post("/users", uploadSingle.single('image'), adminController.createUser);
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id", uploadSingle.single('image'), adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

export default router;
