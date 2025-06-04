//src/utils/auth/generateToken.ts
import jwt from 'jsonwebtoken';

export const generateToken = (payload: object) => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: '1d' // 1 día de expiración
  });
};

//Instala por si no lo tienens pnpm add jsonwebtoken