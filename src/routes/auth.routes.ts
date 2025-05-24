// src/routes/auth.routes.ts
import { Router } from "express";
import { register, login, getUserProfile } from "@/controllers/auth.controller";
import { validateRegister } from "@/middlewares/validateRegister";
import { validateLogin } from "@/middlewares/validateLogin";
import passport from "passport";
import { updateGoogleProfile } from "../controllers/auth.controller";
import { checkPhoneExists } from "@/controllers/auth.controller";
import { me } from "@/controllers/auth.controller";
import { isAuthenticated } from "@/middlewares/isAuthenticated";
import {deleteProfilePhoto,uploadProfilePhoto,upload,} from "@/controllers/authPerfilUsuarioRenter/fotoPerfil.controller";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { updateUserField } from "@/controllers/auth.controller"; 

const router = Router();

router.post("/google/complete-profile", updateGoogleProfile);

//nombre completo
router.put("/user/update", authMiddleware, updateUserField);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:3000?error=google",
    session: true,
  }),
  (req, res) => {
    // 🔥 Redirige al front para que abra el modal de completar perfil
    res.redirect("http://localhost:3000/home?googleComplete=true");
  }
);
router.get("/auth/success", (req, res) => {
  res.send("Inicio de sesión con Google exitoso!");
});

router.patch("/update-profile", updateGoogleProfile);

router.get("/auth/failure", (req, res) => {
  res.send("Fallo al iniciar sesión con Google.");
});

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", isAuthenticated, me);
router.get("/user-profile/:idUsuario", getUserProfile);

//foto de perfil actualizar/eliminar
router.post(
  "/upload-profile-photo",
  authMiddleware,
  upload.single("fotoPerfil"),
  uploadProfilePhoto
);
router.delete("/delete-profile-photo", authMiddleware, deleteProfilePhoto);

router.post("/check-phone", checkPhoneExists);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:3000/home?error=cuentaExistente",
    session: true,
  }),
  (req, res) => {
    res.redirect("http://localhost:3000/home?googleComplete=true");
  }
);

export default router;
