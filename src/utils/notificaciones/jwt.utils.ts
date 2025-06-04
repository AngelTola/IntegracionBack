//src/notificaciones/jwt.utils.ts
import jwt from 'jsonwebtoken';
import { Request } from 'express';

interface JwtPayload {
  idUsuario: number;
  email: string;
  nombreCompleto: string;
}

export class JWTUtils {
  static extractTokenFromRequest(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const tokenQuery = req.query.token as string;
    if (tokenQuery) {
      return tokenQuery;
    }

    return null;
  }

  static verifyAndDecodeToken(token: string): { payload: JwtPayload | null, error?: string } {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      return { payload: decoded };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { payload: null, error: 'Token expirado' };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return { payload: null, error: 'Token inválido' };
      }
      return { payload: null, error: 'Error al verificar token' };
    }
  }

  static extractAndValidateUser(req: Request): { 
    idUsuario: number | null, 
    userInfo: JwtPayload | null,
    error?: string 
  } {
    const token = this.extractTokenFromRequest(req);
    
    if (!token) {
      return { idUsuario: null, userInfo: null, error: 'Token de autenticación requerido' };
    }

    const { payload, error } = this.verifyAndDecodeToken(token);
    
    if (error || !payload) {
      return { idUsuario: null, userInfo: null, error: error || 'Token inválido' };
    }

    if (!payload.idUsuario || payload.idUsuario <= 0) {
      return { idUsuario: null, userInfo: null, error: 'Usuario inválido en token' };
    }

    return { 
      idUsuario: payload.idUsuario, 
      userInfo: payload 
    };
  }
}