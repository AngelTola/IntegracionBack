//src/types/auth/express/index.d.ts
import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; // Solo el payload (idUsuario, email, nombreCompleto)
    }
  }
}