//src/routes/auth/auth.routes.ts
import { Router } from "express";
import { register, login, getUserProfile } from "../../controllers/auth/auth.controller"; // 👈 IMPORTA BIEN AQUÍ
import { validateRegister } from "../../middlewares/auth/validateRegister"; // 👈 IMPORTAR middleware de validación
import { validateLogin } from "../../middlewares/auth/validateLogin";
import passport from "passport";
import { updateGoogleProfile } from "../../controllers/auth/auth.controller";
import { checkPhoneExists } from "../../controllers/auth/auth.controller";
import { me } from "../../controllers/auth/auth.controller";
import { isAuthenticated } from "../../middlewares/auth/isAuthenticated";
import { deleteIncompleteUserController } from "../../controllers/auth/auth.controller";

//foto de perfil eliminar/actualizar
import {deleteProfilePhoto,uploadProfilePhoto,upload,} from "../../controllers/auth/authPerfilUsuarioRenter/fotoPerfil.controller";
import { authMiddleware } from "../../middlewares/auth/authMiddleware";

//Editar nombre completo
import { updateUserField } from "../../controllers/auth/auth.controller"; // 👈 IMPORTA
import { generateToken } from "../../utils/auth/generateToken"; // Asegúrate de tener esto arriba

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
    failureRedirect: "http://localhost:3000/home?error=google",
    session: false,
  }),
  (req, res) => {
    const user = req.user as { idUsuario: number; email: string; nombreCompleto: string };
    const info = req.authInfo as { message?: string; token?: string; email?: string };
    
    console.log("🔁 CALLBACK GOOGLE:");
    console.log("👤 user:", user);
    console.log("ℹ️  info:", info);

    // ✅ Caso: cuenta ya registrada previamente
    if (info?.message === "alreadyExists" || info?.message === "loginWithGoogle") {
      console.log("⚠️ Usuario ya registrado. Enviando login automático.");
      return res.redirect(
        `http://localhost:3000/home?googleAutoLogin=true&token=${info.token}&email=${info.email}`
      );
    }

    // ✅ Caso: cuenta nueva, requiere completar perfil
    const token = generateToken({
      idUsuario: user.idUsuario,
      email: user.email,
      nombreCompleto: user.nombreCompleto,
    });

    console.log("🧩 Usuario nuevo, redirigiendo a completar perfil");

    return res.redirect(
      `http://localhost:3000/home?googleComplete=true&token=${token}&email=${user.email}`
    );
  }
);


router.get("/auth/success", (req, res) => {
  res.send("Inicio de sesión con Google exitoso!");
});

router.patch('/update-profile', isAuthenticated, updateGoogleProfile);

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

router.delete("/delete-incomplete-user", deleteIncompleteUserController);

router.post("/check-phone", checkPhoneExists);

export default router;
