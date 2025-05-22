import { Request, Response, NextFunction } from 'express';

export const validateRegister = (req: Request, res: Response, next: NextFunction): Promise<void> => {
  return new Promise((resolve) => {
    const { nombre_completo, email, contraseña, fecha_nacimiento } = req.body;

    if (!nombre_completo || !email || !contraseña || !fecha_nacimiento) {
      res.status(400).json({ message: 'Todos los campos obligatorios deben estar completos.' });
      return resolve();
    }

    next();
    resolve();
  });
};
