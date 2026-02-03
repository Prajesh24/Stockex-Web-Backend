import { Router } from "express";
import { authorizedMiddleware,adminMiddleware } from "../../middlewears/authorized.middlewear";
import { AdminUserController } from "../../controllers/admin/admin.controller";
import { uploads } from "../../middlewears/upload.middlewear";

let adminUserController = new AdminUserController();

const router = Router();

router.use(authorizedMiddleware); // apply all with middleware
router.use(adminMiddleware); // apply all with middleware

router.post("/", uploads.single("imageUrl"), adminUserController.createUser);
router.get("/", adminUserController.getAllUsers);
router.put("/:id", uploads.single("imageUrl"), adminUserController.updateUser);
router.delete("/:id", adminUserController.deleteUser);
router.get("/:id", adminUserController.getUserById);

export default router;