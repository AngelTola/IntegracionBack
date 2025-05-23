/* import passport from "passport";
import { PrismaClient } from "@prisma/client";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "https://redibo-back-wtt.vercel.app/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("🔵 Iniciando autenticación Google - Perfil recibido:", JSON.stringify(profile, null, 2)); // 👈 Log 1
      try {
        const email = profile.emails?.[0].value;
        let user = await prisma.usuario.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.usuario.create({
            data: {
              email,
              nombre_completo: profile.displayName || "",
            },
          });
        }

        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

// 🟢 Serialización de sesión
passport.serializeUser((user: any, done) => {
  done(null, user.email); // Guardás el email en la sesión
});

passport.deserializeUser(async (email: string, done) => {
  try {
    const user = await prisma.usuario.findUnique({ where: { email } });
    done(null, user || null);
  } catch (err) {
    done(err, null);
  }
});
  //sadasdsadasda
 */