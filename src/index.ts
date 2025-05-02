import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import passwordRoutes from './routes/password.routes';
import authRoutes from './routes/auth.routes';
import session from "express-session";
import passport from "passport";
import vehiculoRoutes from './routes/vehiculo.routes';
import pagosRoutes from './routes/pagos.routes'; // Importamos las rutas de pagos
import "./config/googleAuth"; // <--- importante

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: "http://localhost:3000", // tu frontend
  credentials: true,               // 🔥 para enviar cookies/sesiones
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/pagos', pagosRoutes); // Agregamos las rutas de pagos con prefijo /api/pagos
app.use(vehiculoRoutes);

// End point para verificar la salud de la conexión de la API
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});