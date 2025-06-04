//src/middlewares/auth/isAuthenticated.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  console.log("🔐 Token recibido:", token);
  if (!token) {
     res.status(401).json({ message: 'Token no proporcionado' });
     return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    console.log("✅ Usuario decodificado del token:", decoded); // ✅ Log del usuario

    req.user = decoded; // 👈 Aquí queda el usuario
      next();
    } catch (error) {

      console.error("❌ Token inválido:", error); // ✅ Log de error de token
      res.status(403).json({ message: 'Token inválido' });
      return;
    }
};