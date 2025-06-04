//src/middlewares/auth/validateLogin.ts
import { Request, Response, NextFunction } from 'express';

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;
  const allowedDomains = [
    '@gmail.com', '@outlook.com', '@hotmail.com',
    '@live.com', '@yahoo.com', '@icloud.com', '@proton.me'
  ];

  if (!email || !password) {
    res.status(400).json({ message: 'Email y contraseña son requeridos' });
    return;
  }

  if (email.length > 70) {
    res.status(400).json({ message: 'La cantidad máxima es de 70 caracteres' });
    return;
  }

  if (!email.includes('@')) {
    res.status(400).json({ message: 'Incluye un signo @ en el correo electrónico.' });
    return;
  }

  const atIndex = email.indexOf('@');
  if (atIndex <= 0) {
    res.status(400).json({ message: 'Ingresa nombre de usuario antes del signo @' });
    return;
  }

  const domainPart = email.substring(atIndex + 1);
  if (!domainPart || domainPart.trim() === '') {
    res.status(400).json({ message: 'Ingresa un dominio después del signo @' });
    return;
  }

  const emailDomain = email.substring(email.indexOf('@'));
  if (!allowedDomains.includes(emailDomain)) {
    res.status(400).json({ message: 'Introduzca un dominio correcto' });
    return;
  }

  if (password.length === 25) {
    res.status(400).json({ message: 'La cantidad máxima es de 25 caracteres' });
    return;
  }

  if (password.length < 8 || password.length > 25) {
    res.status(400).json({ message: 'La contraseña debe tener entre 8 y 25 caracteres' });
    return;
  }

  next(); // ✅ si todo es válido, pasa al siguiente middleware
};
