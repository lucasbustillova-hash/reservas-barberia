"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const LISTA_BARBEROS = [
  { 
    nombre: 'Charlie', 
    foto: '/charlie.png' 
  },
  { 
    nombre: 'Barbero 2', 
    foto: 'https://ui-avatars.com/api/?name=Barbero+2&background=random' 
  },
  { 
    nombre: 'Barbero 3', 
    foto: 'https://ui-avatars.com/api/?name=Barbero+3&background=random' 
  },
  { 
    nombre: 'Barbero 4', 
    foto: 'https://ui-avatars.com/api/?name=Barbero+4&background=random' 
  }
];

export default function Home() {
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    barbero: LISTA_BARBEROS[0].nombre, 
    servicio: 'Corte Clásico',
    fecha: '',
    hora: ''
  })
  const [horasOcupadas, setHorasOcupadas] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const generarHorarios = () => {
    const horarios = []
    let h = 8, m = 0
    while (h < 17 || (h === 17 && m === 0)) {
      horarios.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
      m += 45
      if (m >= 60) { h++; m -= 60 }
    }
    return horarios
  }

  const horariosDisponibles = generarHorarios()

  useEffect(() => {
    if (formData.fecha && formData.barbero) {
      const consultarOcupados = async () => {
        const { data } = await supabase
          .from('reservas')
          .select('fecha_hora')
          .eq('barbero', formData.barbero)
          .like('fecha_hora', `${formData.fecha}%`)
        
        const ocupadas = data?.map(d => d.fecha_hora.split(' ')[1].substring(0, 5)) || []
        setHorasOcupadas(ocupadas)
      }
      consultarOcupados()
    }
  }, [formData.fecha, formData.barbero])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const seleccionarBarbero = (nombre) => {
    setFormData({ ...formData, barbero: nombre, hora: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.hora) { setMensaje('⚠️ Por favor elige una hora'); return }
    setCargando(true)

    const dataParaEnviar = {
      cliente_nombre: formData.cliente_nombre,
      cliente_telefono: formData.cliente_telefono,
      barbero: formData.barbero,
      servicio: formData.servicio,
      fecha_hora: `${formData.fecha} ${formData.hora}`
    }

    const { error } = await supabase.from('reservas').insert([dataParaEnviar])

    if (error) {
      setMensaje('❌ Error al guardar.')
    } else {
      setMensaje('✅ ¡Reserva confirmada con éxito!')
      setFormData({ ...formData, cliente_nombre: '', cliente_telefono: '', hora: '', fecha: '' })
    }
    setCargando(false)
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 flex items-center justify-center font-sans">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h1 className="text-2xl font-black text-center text-gray-900 mb-6 uppercase tracking-tight">Barbería Charlie</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-gray-900 text-xs font-black uppercase mb-1 ml-1">Tu Nombre</label>
            <input 
              type="text" 
              name="cliente_nombre" 
              value={formData.cliente_nombre} 
              onChange={handleChange} 
              required 
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-black font-bold placeholder:text-gray-400" 
              placeholder="Ej. Lucas" 
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-gray-900 text-xs font-black uppercase mb-1 ml-1">WhatsApp</label>
            <input 
              type="tel" 
              name="cliente_telefono" 
              value={formData.cliente_telefono} 
              onChange={handleChange} 
              required 
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-black font-bold placeholder:text-gray-400" 
              placeholder="7000-0000" 
            />
          </div>

          {/* Servicio */}
          <div>
            <label className="block text-gray-900 text-xs font-black uppercase mb-1 ml-1">Servicio</label>
            <select 
              name="servicio" 
              value={formData.servicio} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white text-black font-bold"
            >
              <option value="Corte Clásico">Corte Clásico</option>
              <option value="Corte + Barba">Corte + Barba</option>
              <option value="Solo Barba">Solo Barba</option>
              <option value="Corte para Niños">Corte para Niños 👶</option>
            </select>
          </div>

          {/* Barberos */}
          <div>
            <label className="block text-gray-900 text-xs font-black uppercase mb-2 ml-1 text-center">Selecciona tu Barbero</label>
            <div className="flex gap-4 justify-center">
              {LISTA_BARBEROS.map((b) => (
                <div key={b.nombre} onClick={() => seleccionarBarbero(b.nombre)} className={`flex flex-col items-center cursor-pointer p-2 rounded-2xl border-2 transition-all ${formData.barbero === b.nombre ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-100 hover:bg-gray-50'}`}>
                  <img 
  src={b.foto} 
  className="w-20 h-20 rounded-full object-cover mb-2 border-2 border-gray-200 shadow-sm" 
/>
                  <span className="text-[10px] font-black uppercase text-gray-800">{b.nombre}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-gray-900 text-xs font-black uppercase mb-1 ml-1">Día del corte</label>
            <input 
              type="date" 
              name="fecha" 
              value={formData.fecha} 
              onChange={handleChange} 
              required 
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white text-black font-bold" 
            />
          </div>

          {/* Horas */}
          {formData.fecha && (
            <div className="animate-in fade-in zoom-in duration-300">
              <label className="block text-gray-900 text-xs font-black uppercase mb-2 ml-1">Horas disponibles (45 min)</label>
              <div className="grid grid-cols-3 gap-2">
                {horariosDisponibles.map((h) => {
                  const estaOcupada = horasOcupadas.includes(h)
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={estaOcupada}
                      onClick={() => setFormData({ ...formData, hora: h })}
                      className={`py-2 text-sm font-black rounded-xl border-2 transition-all ${estaOcupada ? 'bg-gray-200 text-gray-400 border-gray-200 line-through' : formData.hora === h ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' : 'bg-white text-black border-gray-300 hover:border-blue-400'}`}
                    >
                      {h}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          <button type="submit" disabled={cargando} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all uppercase tracking-widest text-sm active:scale-95 disabled:bg-gray-400 mt-4">
            {cargando ? 'Guardando...' : 'Confirmar Cita'}
          </button>
        </form>

        {mensaje && (
          <div className={`mt-6 p-4 text-center font-black rounded-xl border-2 ${mensaje.includes('✅') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
            {mensaje}
          </div>
        )}
      </div>
    </main>
  )
}