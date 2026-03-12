"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Turnos() {
  const [reservas, setReservas] = useState([])

  useEffect(() => {
    const cargarReservas = async () => {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .order('fecha_hora', { ascending: true })
      
      if (data) setReservas(data)
    }
    cargarReservas()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Panel de Turnos (Barbero)</h1>
      <div className="grid gap-4">
        {reservas.map((reserva) => (
          <div key={reserva.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{reserva.cliente_nombre}</p>
              <p className="text-gray-600">Servicio: {reserva.servicio}</p>
              <p className="text-gray-600">Barbero: {reserva.barbero}</p>
              <p className="text-gray-800 font-semibold">
                📅 {new Date(reserva.fecha_hora).toLocaleString('es-SV', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
            <a 
              href={`https://wa.me/503${reserva.cliente_telefono.replace(/\D/g, '')}`} 
              target="_blank" 
              className="bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600"
            >
              WhatsApp
            </a>
          </div>
        ))}
        {reservas.length === 0 && <p>No hay reservas todavía.</p>}
      </div>
    </div>
  )
}