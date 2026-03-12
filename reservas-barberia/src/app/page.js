"use client"
import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function Home() {
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    barbero: 'Cualquiera',
    servicio: 'Corte Clásico',
    fecha_hora: ''
  })
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    setMensaje('')

    // Arreglo para que la fecha se guarde limpia
    const dataParaEnviar = {
      ...formData,
      fecha_hora: formData.fecha_hora.replace('T', ' ')
    }

    const { error } = await supabase
      .from('reservas')
      .insert([dataParaEnviar])

    if (error) {
      setMensaje('❌ Error al guardar. Revisa la consola.')
      console.error(error)
    } else {
      setMensaje('✅ ¡Reserva confirmada con éxito!')
      setFormData({ cliente_nombre: '', cliente_telefono: '', barbero: 'Cualquiera', servicio: 'Corte Clásico', fecha_hora: '' })
    }
    setCargando(false)
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Agenda tu Corte</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Tu Nombre</label>
            <input type="text" name="cliente_nombre" value={formData.cliente_nombre} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-gray-700" placeholder="Ej. Juan Pérez" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Teléfono</label>
            <input type="tel" name="cliente_telefono" value={formData.cliente_telefono} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-gray-700" placeholder="7000-0000" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Servicio</label>
            <select name="servicio" value={formData.servicio} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg text-gray-700">
              <option value="Corte Clásico">Corte Clásico</option>
              <option value="Corte + Barba">Corte + Barba</option>
              <option value="Solo Barba">Solo Barba</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Barbero</label>
            <select name="barbero" value={formData.barbero} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg text-gray-700">
              <option value="Cualquiera">Cualquiera</option>
              <option value="El Dueño">El Dueño</option>
              <option value="Barbero 2">Barbero 2</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Fecha y Hora</label>
            <input type="datetime-local" name="fecha_hora" value={formData.fecha_hora} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-gray-700" />
          </div>
          <button type="submit" disabled={cargando} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
            {cargando ? 'Guardando...' : 'Confirmar Reserva'}
          </button>
        </form>
        {mensaje && <div className="mt-4 p-3 text-center font-semibold rounded-lg bg-gray-50 text-gray-800">{mensaje}</div>}
      </div>
    </main>
  )
}