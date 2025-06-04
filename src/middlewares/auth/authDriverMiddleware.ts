//src/middlewares/auth/authDriverMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  idUsuario: number;
  email: string;
  nombreCompleto: string;
}

export const authDriverMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token no proporcionado" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "clave_secreta"
    ) as JwtPayload;

    // ✅ Cast correcto para evitar error de tipos
    (req as Request & { user?: JwtPayload }).user = {
      idUsuario: decoded.idUsuario,
      email: decoded.email,
      nombreCompleto: decoded.nombreCompleto,
    };

    next();
  } catch (error) {
    res.status(403).json({ message: "Token inválido" });
  }
};