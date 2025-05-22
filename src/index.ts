import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();
import passwordRoutes from "../src/routes/password.routes";
import authRoutes from "../src/routes/auth.routes";
import session from "express-session";
import passport from "passport";
import "../src/config/googleAuth";
import authRegistroHostRoutes from "../src/routes/registroHost.routes";
import authRegistroDriverRoutes from './routes/registroDriver.routes'; // Import the driver routes
import "./config/googleAuth"; // <--- importante
import usuarioRoutes from './routes/usuario.routes';
import visualizarDriverRoutes from "./routes/visualizarDriver.routes";

import path from 'path';
// Cargar variables de entorno

const app = express();
const PORT = process.env.PORT || 3001;


// ✅ CORS robusto – que responde incluso si hay error
app.use((req: express.Request, res: express.Response, next: express.NextFunction): void => {
  res.header("Access-Control-Allow-Origin", "http://34.10.219.81:3000");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
});

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//foto de perfil
/*app.use('/uploads', express.static('uploads'));*/
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); //permite desde cualquier origen
  res.header('Access-Control-Allow-Methods', 'GET');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));
app.use(
  session({
    secret: "mi_clave_secreta_segura", // cámbiala por algo más seguro
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // ⚠️ en producción debe ser true con HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static('uploads')); // Servir imágenes desde el servidor

app.use('/api', authRoutes);
app.use('/api', passwordRoutes);
app.use('/api', authRegistroHostRoutes);
app.use('/api', authRegistroDriverRoutes); // Añadir la ruta de registro de driver aquí
app.use('/api', usuarioRoutes); // Añadir la ruta de usuario aquí
app.use('/api', visualizarDriverRoutes);// Añadir la ruta de visualizar driver aquí


// End point para verificar la salud de la conexión de la API
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});