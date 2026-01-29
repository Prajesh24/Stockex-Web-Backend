import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizedMiddleware } from "../middlewears/middlewear";
import { uploadSingle } from "../config/multer.config";

let authController = new AuthController();
const router = Router();

router.post("/register", authController.register)
router.post("/login", authController.login)
router.put("/:id", authorizedMiddleware, uploadSingle.single('image'), authController.updateProfile)

export default router;