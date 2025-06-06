import { Request, Response } from "express";
import { prisma } from '../../lib/qantastic/prisma';
import { isValid, parseISO } from "date-fns";

export const getAutos = async (req: Request, res: Response) => {
  try {
    const autos = await prisma.auto.findMany({
      include: {
        imagenes: true,
        ubicacion: true,
        comentarios: {
          select: {
            calificacion: true,
          }
        }
      },
    });

    const autosConPromedio = autos.map(auto => {
      let promedioCalificacion = 0;
      const comentarios = auto.comentarios || [];

      if (comentarios.length > 0) {
        const sumaCalificaciones = comentarios.reduce((suma, comentario) => suma + comentario.calificacion, 0);
        promedioCalificacion = sumaCalificaciones / comentarios.length;
      }

      return {
        ...auto,
        promedioCalificacion: Number(promedioCalificacion.toFixed(1)),
      };
    });
    
    res.status(200).json({
      success: true,
      data: autosConPromedio,
    });
    
  } catch (error) {
    console.error("Error en getAutos:", error);
    res.status(500).json({
      success: false,
      message: "Error en obtener los autos",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

export const getAutoId = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
  
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "ID inválido proporcionado.",
      });
      return;
    }
  
    try {
      const auto = await prisma.auto.findUnique({
        where: {
          idAuto: id,
        },
        include: {
          propietario: {
            select: {
              idUsuario: true,
              nombreCompleto: true,
              telefono: true,
              email: true, 
              direccion: true,
            },
          },
          imagenes: true,
        },
      });
  
      if (!auto) {
        res.status(404).json({
          success: false,
          message: "Auto no encontrado.",
        });
        return;
      }
  
      res.status(200).json({
        success: true,
        data: auto,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener el auto.",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

export const getComentarios = async (req: Request, res: Response): Promise<void> => {
    const autoId = parseInt(req.params.id, 10);
  
    if (isNaN(autoId)) {
      res.status(400).json({
        success: false,
        message: "ID inválido proporcionado.",
      });
      return;
    }
  
    try {
      const comentarios = await prisma.comentario.findMany({
        where: {
          idAuto: autoId,
        },
        include: {
          usuario: {
            select: {
              idUsuario: true,
              nombreCompleto: true,
            },
          },
        },
        orderBy: {
          fechaCreacion: 'desc',
        }
      });
  
      res.status(200).json({
        success: true,
        data: comentarios, 
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener los comentarios del auto.",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };


export const getHost = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { inicio, fin } = req.params;

  const fechaInicio = parseISO(inicio);
  const fechaFin = parseISO(fin);

  if (!isValid(fechaInicio) || !isValid(fechaFin) || fechaInicio > fechaFin) {
    res.status(400).json({
      success: false,
      message: "Fechas inválidas o fuera de rango.",
    });
    return;
  }

  try {
    const fechaInicio = parseISO(inicio).toISOString().split("T")[0];
    const fechaFin = parseISO(fin).toISOString().split("T")[0];
    const host = await prisma.usuario.findUnique({
      where: { idUsuario: id },
      include: {
        autos: {
          select: {
            idAuto: true,
            modelo: true,
            marca: true,
            precioRentaDiario: true,
            calificacionPromedio:true,
            imagenes:true,
            reservas: {
              where: {
                estado: "CONFIRMADA" ,
                fechaInicio: { lte: new Date(`${fechaFin}T23:59:59.999Z`) } ,
                fechaFin: { gte: new Date(`${fechaInicio}T00:00:00.000Z`) } ,
              },
            },
            disponibilidad: {
              where: {
                fechaInicio: { lte: new Date(`${fechaFin}T23:59:59.999Z`) },
                fechaFin: { gte: new Date(`${fechaInicio}T00:00:00.000Z`) },
              },
            },
          },
        },
      },
    });

    if (!host || !host.esAdmin) {
      res.status(400).json({
        success: false,
        message: "El usuario no es un host válido.",
      });
      return;
    }

      const autosConDisponibilidad = host.autos.map(auto => {
      const tieneReserva = auto.reservas.length > 0;
      const noDisponible = auto.disponibilidad.length > 0;
      const disponible = !tieneReserva && !noDisponible;

      return {
        idAuto: auto.idAuto,
        modelo: auto.modelo,
        marca: auto.marca,
        precio: auto.precioRentaDiario,
        calificacionPromedio: auto.calificacionPromedio,
        imagenes: auto.imagenes,
        disponible,
      };
    });

    res.status(200).json({
      success: true,
      host: {
        ...host,
        autos: autosConDisponibilidad,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener la información del host.",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};


export const getAutosDisponiblesPorFecha = async (req: Request, res: Response): Promise<void> => {
  const { inicio, fin } = req.params;

  const fechaInicio = parseISO(inicio);
  const fechaFin = parseISO(fin);

  if (!isValid(fechaInicio) || !isValid(fechaFin) || fechaInicio > fechaFin) {
    res.status(400).json({
      success: false,
      message: "Fechas inválidas o fuera de rango.",
    });
    return;
  }

  try {
    const fechaInicio = parseISO(inicio).toISOString().split("T")[0];
    const fechaFin = parseISO(fin).toISOString().split("T")[0];
    const autosDisponibles = await prisma.auto.findMany({
      where: {
        disponibilidad: {
          none: {
            AND: [
              {
                fechaInicio: { lte: new Date(`${fechaFin}T23:59:59.999Z`) },
              },
              {
                fechaFin: { gte: new Date(`${fechaInicio}T00:00:00.000Z`) },
              },
            ],
          },
        },
        reservas: {
          none: {
            AND: [
              { estado: "CONFIRMADA" },
              { fechaInicio: { lte: new Date(`${fechaFin}T23:59:59.999Z`) } },
              { fechaFin: { gte: new Date(`${fechaInicio}T00:00:00.000Z`) } },
            ],
          },
        },
      },
        select: {
          idAuto: true,
          marca:true,
          modelo:true,
          capacidadMaletero:true,
          asientos:true,
          transmision:true,
          combustible:true,
          kilometraje:true,
          precioRentaDiario:true,
          calificacionPromedio:true,
          imagenes:true,
        },
      });
  
      res.status(200).json({
        success: true,
        data: autosDisponibles,
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener autos disponibles.",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  export const getDrivers = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.id, 10);
  
      if (isNaN(userId)) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
      }
  
      const usuario = await prisma.usuario.findUnique({
        where: { idUsuario: userId },
        include: {
          driversAsignados: {
            include: {
              driver: true,
            },
          },
        },
      });
  
      if (!usuario) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
  
      const drivers = usuario.driversAsignados.map((asignacion) => asignacion.driver);
  
      res.status(200).json(drivers);
    } catch (error) {
      console.error('Error al obtener los drivers:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
  
export const getUsuarios = async (req: Request, res: Response) => {
  try {
    // Consulta a la base de datos usando Prisma
    const usuarios = await prisma.usuario.findMany({
      select: {
        idUsuario: true,
        nombreCompleto: true,
        email: true,
        telefono: true,
        fechaRegistro: true,
        esAdmin: true,
      },
    });

    res.status(200).json({
      success: true,
      data: usuarios,
    });
  } catch (error) {
    console.error("Error en getUsuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los usuarios",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

export const getUsuarioId = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
  
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "ID inválido proporcionado.",
      });
      return;
    }
  
    try {
      const usuario = await prisma.usuario.findUnique({
        where: {
          idUsuario: id,
        }
      });
  
      if (!usuario) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado.",
        });
        return;
      }
  
      res.status(200).json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener el usuario",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

export const getCalificacionesHost = async (req: Request, res: Response): Promise<void> => {
  const hostId = parseInt(req.params.id, 10);

  if (isNaN(hostId)) {
    res.status(400).json({
      success: false,
      message: "ID del host inválido proporcionado.",
    });
    return;
  }

  try {
    // Verificar que el usuario existe y es un host
    const host = await prisma.usuario.findUnique({
      where: { idUsuario: hostId },
      select: { host: true },
    });

    if (!host) {
      res.status(404).json({
        success: false,
        message: "El usuario no existe.",
      });
      return;
    }

    if (!host.host) {
      res.status(403).json({
        success: false,
        message: "El usuario no tiene permisos de host.",
      });
      return;
    }

    // Obtener las calificaciones dirigidas al host
    const calificaciones = await prisma.calificacionUsuario.findMany({
      where: { idCalificado: hostId },
      select: {
        idCalificacion: true, // 👈 Agrega esto
        idCalificador: true,
        comentario: true,
        puntuacion: true,
        fechaCreacion: true,
        calificador: {
          select: {
            idUsuario: true,
            nombreCompleto: true
          },
        },
      },
      orderBy: {
        fechaCreacion: "desc",
      },
    });


    res.status(200).json({
      success: true,
      data: calificaciones.map((calificacion) => ({
        idCalificacion: calificacion.idCalificacion, // 👈 Correcto aquí
        idCalificador: calificacion.idCalificador,
        nombre: calificacion.calificador.nombreCompleto,
        comentario: calificacion.comentario,
        puntuacion: calificacion.puntuacion,
        fechaCreacion: calificacion.fechaCreacion,
      })),
    });


  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener las calificaciones del host.",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

export const getHostSinFiltroFechas = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      message: "ID del host inválido proporcionado.",
    });
    return;
  }

  try {
    const host = await prisma.usuario.findUnique({
      where: { idUsuario: id },
      include: {
        autos: {
          select: {
            idAuto: true,
            modelo: true,
            marca: true,
            precioRentaDiario: true,
            calificacionPromedio: true,
            imagenes: true,
          },
        },
      },
    });

    if (!host || !host.host) {
      res.status(404).json({
        success: false,
        message: "El usuario no es un host o no existe.",
      });
      return;
    }

    const autosConDatos = host.autos.map(auto => ({
      idAuto: auto.idAuto,
      modelo: auto.modelo,
      marca: auto.marca,
      precio: auto.precioRentaDiario,
      calificacionPromedio: auto.calificacionPromedio,
      imagenes: auto.imagenes,
      disponible: true,
    }));

    res.status(200).json({
      success: true,
      host: {
        ...host,
        autos: autosConDatos,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener los autos del host.",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};
