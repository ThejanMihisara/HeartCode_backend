import express from "express";
import { createUser, getMe, loginUser, logoutUser, updateMe } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
userRouter.get("/me", getMe);
userRouter.patch("/me", updateMe);

export default userRouter;
