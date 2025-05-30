import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Creación de usuarios
  const usuarioMain = await prisma.usuario.create({
    data: {
      id: '24fdafde-3838-475c-90b5-d4c56dba5f5a',
      nombre: 'Juan',
      apellido: 'Pérez',
      rol: 'Arrendador',
    },
  })

  // Creación de vehículos
  const autoMain = await prisma.auto.create({
    data: {
      marca: 'Toyota',
      modelo: 'Corolla',
      año: 2021,
      placa: 'ABC123',
      color: 'Gris Oscuro',
      precioRentaDiario: 500.00,
      montoGarantia: 1500.00,
      estado: 'DISPONIBLE',
      propietarioId: usuarioMain.id,
      imagenes: "https://i.imgur.com/jcTD61j.jpeg",
    },
  })

  const auto1 = await prisma.auto.create({
    data: {
      marca: 'Honda',
      modelo: 'Civic',
      año: 2020,
      placa: 'XYZ456',
      color: 'Rojo',
      precioRentaDiario: 600.00,
      montoGarantia: 1600.00,
      estado: 'DISPONIBLE',
      propietarioId: usuarioMain.id,
      imagenes: "https://i.imgur.com/lbERP1a.jpeg",
    },
  })

  const auto2 = await prisma.auto.create({
    data: {
      marca: 'Ford',
      modelo: 'Focus',
      año: 2022,
      placa: 'LMN789',
      color: 'Negro',
      precioRentaDiario: 550.00,
      montoGarantia: 1400.00,
      estado: 'DISPONIBLE',
      propietarioId: usuarioMain.id,
      imagenes: "https://i.imgur.com/ymVHxNc.jpeg",
    },
  })

  // Creación de reservas
  const reservaEnCurso = await prisma.reserva.create({
    data: {
      idReserva: 'reserva01',
      fechaInicio: new Date('2025-05-01'),
      fechaFin: new Date('2025-05-10'),
      autoId: autoMain.id,
      idCliente: usuarioMain.id,
      estado: 'APROBADA',
      fechaLimitePago: new Date('2025-04-28'),
      montoTotal: 5000.00,
      montoPagado: 2500.00,
      estaPagada: false,
    },
  })

  const reservaEntregada1 = await prisma.reserva.create({
    data: {
      idReserva: 'reserva02',
      fechaInicio: new Date('2025-04-01'),
      fechaFin: new Date('2025-04-05'),
      autoId: auto1.id,
      idCliente: usuarioMain.id,
      estado: 'APROBADA',
      fechaLimitePago: new Date('2025-03-29'),
      montoTotal: 3000.00,
      montoPagado: 3000.00,
      estaPagada: true,
    },
  })

  const reservaEntregada2 = await prisma.reserva.create({
    data: {
      idReserva: 'reserva03',
      fechaInicio: new Date('2025-04-10'),
      fechaFin: new Date('2025-04-12'),
      autoId: auto2.id,
      idCliente: usuarioMain.id,
      estado: 'APROBADA',
      fechaLimitePago: new Date('2025-04-07'),
      montoTotal: 3200.00,
      montoPagado: 3200.00,
      estaPagada: true,
    },
  })

  // Creación de rentas
  const rentaFinalizada = await prisma.renta.create({
    data: {
      id: 'renta01',
      fechaInicio: new Date('2025-04-01'),
      fechaFin: new Date('2025-04-05'),
      montoTotal: 3000.00,
      kilometrajeInicial: 10000,
      kilometrajeFinal: 10500,
      estatus: 'FINALIZADA',
      fechaAprobacion: new Date('2025-03-28'),
      reservaId: reservaEntregada1.idReserva,
      clienteId: usuarioMain.id,
      autoId: auto1.id,
    },
  })

  const rentaCancelada = await prisma.renta.create({
    data: {
      id: 'renta02',
      fechaInicio: new Date('2025-04-15'),
      fechaFin: new Date('2025-04-18'),
      montoTotal: 3200.00,
      kilometrajeInicial: 5000,
      kilometrajeFinal: 5000,
      estatus: 'CANCELADA',
      fechaAprobacion: new Date('2025-04-10'),
      reservaId: reservaEntregada2.idReserva,
      clienteId: usuarioMain.id,
      autoId: auto2.id,
    },
  })

  // Creación de comentario para renta cancelada
  const comentario = await prisma.calificacion.create({
    data: {
      puntuacion: 2,
      comentario: 'La renta fue cancelada debido a problemas de disponibilidad del vehículo.',
      rentaId: rentaCancelada.id,
    },
  })

  const comentarioFinalizado = await prisma.calificacion.create({
    data: {
      puntuacion: 5,
      comentario: 'Excelente servicio y buen estado del auto, recomiendo.',
      rentaId: rentaFinalizada.id,
    },
  })

  console.log('Datos generados exitosamente.')
}

main()
  .catch(e => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })