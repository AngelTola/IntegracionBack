import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";
import { findOrCreateGoogleUser } from "../services/auth/auth.service";
import { generateToken } from "../utils/auth/generateToken";

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL:
      "http://localhost:3001/api/auth/google/callback",
  },
  async (_accessToken, _refreshToken, profile, done) => {
    console.log("🔵 Perfil de Google:", profile);
    console.log(
      "🔵 Iniciando autenticación Google - Perfil recibido:",
      JSON.stringify(profile, null, 2)
    ); // 👈 Log 1
      try {
        const email = profile.emails?.[0].value;
        const name = profile.displayName;

        console.log("📧 Email:", email);
        console.log("👤 Nombre:", name);

        console.log("📧 Email obtenido de Google:", email); // 👈 Log 2
        if (!email)
          return done(
            new Error("No se pudo obtener el email de Google"),
            false
          );
        console.log("🔄 Buscando/creando usuario en DB...");
        const { user, isNew } = await findOrCreateGoogleUser(email, name);

        const token = generateToken({
          idUsuario: user.idUsuario,
          email: user.email,
          nombreCompleto: user.nombreCompleto,
        });

        if (user.registradoCon === "email") {
          console.warn("⚠️ Correo ya registrado manualmente:", email);

          console.log("✅ Usuario autenticado y token generado");

          // ✅ Devolver token junto con usuario
          return done(null, false, {
            message: "alreadyExists",
            token,
            email,
          });
        }

        // ✅ Usuario nuevo o registrado con Google
        if (!isNew) {
          console.log("🔄 Usuario ya registrado con Google");
          return done(null, user, { message: "loginWithGoogle", token, email });
        }

        // ✅ Usuario nuevo
        console.log("🆕 Usuario creado con Google");
        return done(null, user); // sin info extra, se redirige a completar perfil
      } catch (error: any) {
        console.error("❌ Error en GoogleStrategy:", error);
        if (error.name === "EmailAlreadyRegistered") {
          return done(null, false, { message: error.message });
        }

        return done(error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.email); // 👈 guardamos solo el email
});

passport.deserializeUser(async (email: string, done) => {
  try {
    const user = await prisma.usuario.findUnique({ where: { email } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
