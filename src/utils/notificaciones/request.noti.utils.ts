//src/notificaciones/request.noti.utils.ts
import { Request } from 'express';

export class RequestUtils {
  
  /**
   * Convierte cualquier valor a número de forma segura
   * @param value - Valor a convertir (string, number, array, etc.)
   * @returns number | null
   */
  static parseToNumber(value: any): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    
    if (Array.isArray(value)) {
      value = value[0];
    }
    
    if (typeof value === 'number') {
      return isNaN(value) ? null : value;
    }
    
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Convierte cualquier valor a string de forma segura
   * @param value - Valor a convertir
   * @returns string | null
   */
  static parseToString(value: any): string | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    
    if (Array.isArray(value)) {
      value = value[0];
    }
    
    return String(value);
  }

  /**
   * Extrae y valida usuarioId desde diferentes fuentes del Request
   * @param req - Request object de Express
   * @param source - Fuente de donde extraer el usuarioId ('params' | 'query' | 'body')
   * @returns number | null
   */
  static getUsuarioId(req: Request, source: 'params' | 'query' | 'body' = 'params'): number | null {
    let value: any;
    
    switch (source) {
      case 'params':
        value = req.params.usuarioId;
        break;
      case 'query':
        value = req.query.usuarioId;
        break;
      case 'body':
        value = req.body?.usuarioId;
        break;
    }
    
    return this.parseToNumber(value);
  }

  /**
   * Valida que el usuarioId sea válido y devuelve error si no lo es
   * @param usuarioId - ID del usuario a validar
   * @returns { isValid: boolean, error?: string }
   */
  static validateUsuarioId(usuarioId: number | null): { isValid: boolean; error?: string } {
    if (!usuarioId || usuarioId <= 0) {
      return {
        isValid: false,
        error: 'usuarioId debe ser un número válido mayor a 0'
      };
    }
    
    return { isValid: true };
  }

  /**
   * Extrae y valida usuarioId en un solo paso
   * @param req - Request object de Express
   * @param source - Fuente de donde extraer el usuarioId
   * @returns { usuarioId: number | null, error?: string }
   */
  static extractAndValidateUsuarioId(
    req: Request, 
    source: 'params' | 'query' | 'body' = 'params'
  ): { usuarioId: number | null; error?: string } {
    const usuarioId = this.getUsuarioId(req, source);
    const validation = this.validateUsuarioId(usuarioId);
    
    if (!validation.isValid) {
      return {
        usuarioId: null,
        error: validation.error
      };
    }
    
    return { usuarioId };
  }

  /**
   * Parsea múltiples parámetros de query de una vez
   * @param query - req.query object
   * @param params - Array de nombres de parámetros a parsear
   * @returns Object con los parámetros parseados
   */
  static parseQueryParams(query: any, params: { name: string; type: 'string' | 'number' }[]) {
    const result: any = {};
    
    params.forEach(param => {
      const value = query[param.name];
      if (value !== undefined) {
        result[param.name] = param.type === 'number' 
          ? this.parseToNumber(value)
          : this.parseToString(value);
      }
    });
    
    return result;
  }
}