//src/middlewares/auth/validateRegister.ts
import { Request, Response, NextFunction } from 'express';

export const validateRegister = (req: Request, res: Response, next: NextFunction): Promise<void> => {
  return new Promise((resolve) => {
    const { nombreCompleto, email, contraseña, fechaNacimiento } = req.body;

    if (!nombreCompleto || !email || !contraseña || !fechaNacimiento) {
      res.status(400).json({ message: 'Todos los campos obligatorios deben estar completos.' });
      return resolve();
    }

    next();
    resolve();
  });
};
