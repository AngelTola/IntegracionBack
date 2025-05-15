import { Request, Response, NextFunction } from 'express';

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const allowedDomains = [
    '@gmail.com', '@outlook.com', '@hotmail.com',
    '@live.com', '@yahoo.com', '@icloud.com', '@proton.me'
  ];

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  if (email.length > 70) {
    return res.status(400).json({ message: 'La cantidad máxima es de 70 caracteres' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ message: 'Incluye un signo @ en el correo electrónico.' });
  }

  const atIndex = email.indexOf('@');
  if (atIndex <= 0) {
    return res.status(400).json({ message: 'Ingresa nombre de usuario antes del signo @' });
  }

  const domainPart = email.substring(atIndex + 1);
  if (!domainPart || domainPart.trim() === '') {
    return res.status(400).json({ message: 'Ingresa un dominio después del signo @' });
  }

  const emailDomain = email.substring(email.indexOf('@'));
  if (!allowedDomains.includes(emailDomain)) {
    return res.status(400).json({ message: 'Introduzca un dominio correcto' });
  }

  if (password.length === 25) {
    return res.status(400).json({ message: 'La cantidad máxima es de 25 caracteres' });
  }

  if (password.length < 8 || password.length > 25) {
    return res.status(400).json({ message: 'La contraseña debe tener entre 8 y 25 caracteres' });
  }

  next();
};