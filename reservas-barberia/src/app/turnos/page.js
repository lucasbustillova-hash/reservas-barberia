"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Turnos() {
  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetchReservas()
  }, [])

  const fetchReservas = async () => {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .order('fecha_hora', { ascending: true })
      if (error) throw error
      setReservas(data)
    } catch (error) {
      console.error('Error:', error.message)
    } finally {
      setCargando(false)
    }
  }

  const formatearFecha = (fechaIso) => {
    const fecha = new Date(fechaIso)
    return fecha.toLocaleString('es-SV', {
      timeZone: 'UTC', // Esto asegura que muestre la hora tal cual se guardó
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Panel del Barbero</h1>
        {cargando ? (
          <p className="text-center text-gray-500 mt-10">Cargando...</p>
        ) : reservas.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No hay turnos aún.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reservas.map((reserva) => (
              <div key={reserva.id} className="bg-white p-5 rounded-xl shadow-md border-l-4 border-blue-600">
                <p className="text-sm text-blue-600 font-bold mb-1 uppercase">
                  {formatearFecha(reserva.fecha_hora)}
                </p>
                <h2 className="text-xl font-bold text-gray-800">{reserva.cliente_nombre}</h2>
                <a href={`https://wa.me/503${reserva.cliente_telefono.replace(/\D/g, '')}`} target="_blank" className="text-green-600 text-sm block mb-3 underline">
                  📱 WhatsApp: {reserva.cliente_telefono}
                </a>
                <div className="pt-2 border-t text-sm text-gray-700">
                  <p><span className="font-semibold">Servicio:</span> {reserva.servicio}</p>
                  <p><span className="font-semibold">Barbero:</span> {reserva.barbero}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}