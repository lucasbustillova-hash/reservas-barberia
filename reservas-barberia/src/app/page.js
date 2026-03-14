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
  
  // NUEVO ESTADO: Guardará los datos del ticket cuando la reserva sea exitosa
  const [ticket, setTicket] = useState(null)

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
      // MAGIA DEL TICKET: Generamos un código único aleatorio
      const codigoGenerado = 'CH-' + Math.random().toString(36).substring(2, 6).toUpperCase()
      
      // Guardamos el ticket y limpiamos el formulario por debajo
      setTicket({ ...formData, codigo: codigoGenerado })
      setFormData({ ...formData, cliente_nombre: '', cliente_telefono: '', hora: '', fecha: '' })
      setMensaje('')
    }
    setCargando(false)
  }

  // Función para resetear y volver a reservar
  const nuevaReserva = () => {
    setTicket(null)
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 flex items-center justify-center font-sans">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 relative overflow-hidden">
        
        {ticket ? (
          /* =========================================
             INTERFAZ DEL TICKET DE CONFIRMACIÓN
             ========================================= */
          <div className="animate-in zoom-in duration-500">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">¡Reserva Confirmada!</h2>
              <p className="text-sm font-bold text-red-500 mt-2 bg-red-50 py-2 rounded-lg border border-red-100">
                📸 Toma captura de este ticket
              </p>
            </div>

            {/* Tarjeta del Ticket (Estilo pase de abordar) */}
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-6 mb-6 relative">
              {/* Recortes visuales de los bordes del ticket */}
              <div className="absolute -left-4 top-1/2 w-8 h-8 bg-white rounded-full border-r-2 border-dashed border-gray-300 transform -translate-y-1/2"></div>
              <div className="absolute -right-4 top-1/2 w-8 h-8 bg-white rounded-full border-l-2 border-dashed border-gray-300 transform -translate-y-1/2"></div>
              
              <div className="text-center mb-6 border-b-2 border-dashed border-gray-200 pb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">CÓDIGO DE RESERVA</p>
                <p className="text-4xl font-black text-blue-600 tracking-tighter">#{ticket.codigo}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Cliente</p>
                  <p className="text-base font-bold text-gray-900 truncate">{ticket.cliente_nombre}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Barbero</p>
                  <p className="text-base font-bold text-gray-900">{ticket.barbero}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Día</p>
                  <p className="text-base font-bold text-gray-900">{ticket.fecha}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Hora</p>
                  <p className="text-base font-bold text-yellow-600">{ticket.hora}</p>
                </div>
                <div className="col-span-2 mt-2 pt-4 border-t border-gray-200">
                  <p className="text-[10px] font-black uppercase text-gray-400">Servicio</p>
                  <p className="text-sm font-bold text-gray-700 bg-gray-100 py-2 px-3 rounded-lg inline-block mt-1">✂️ {ticket.servicio}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={nuevaReserva} 
              className="w-full bg-gray-900 text-white font-black py-4 rounded-xl hover:bg-gray-800 transition-all uppercase tracking-widest text-xs active:scale-95"
            >
              Hacer otra reserva
            </button>
          </div>
        ) : (
          /* =========================================
             INTERFAZ DEL FORMULARIO NORMAL
             ========================================= */
          <>
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
                  onChange={