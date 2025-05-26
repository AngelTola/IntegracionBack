import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: { idUsuario: number };
}

const authDriverMiddleware: RequestHandler = (req, res, next) => {
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
    ) as { idUsuario: number };

    // TypeScript no sabe que `req` es `AuthenticatedRequest`, así que lo forzamos aquí
    (req as AuthenticatedRequest).user = { idUsuario: decoded.idUsuario };

    next();
  } catch (error) {
    res.status(403).json({ message: "Token inválido" });
  }
};

export default authDriverMiddleware;
export type { AuthenticatedRequest };