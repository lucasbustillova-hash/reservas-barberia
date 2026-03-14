'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function TurnosAdmin() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroBarbero, setFiltroBarbero] = useState('Todos')

  const nombresBarberos = ['Todos', 'Charlie', 'Barbero 2', 'Barbero 3', 'Barbero 4']

  useEffect(() => {
    fetchTurnos()
  }, [])

  async function fetchTurnos() {
    setLoading(true)
    try {
      // 1. Intentamos traerlos ordenados
      let { data, error } = await supabase
        .from('reservas')
        .select('*')
        .order('fecha_hora', { ascending: true })
      
      // 2. LA RED DE SEGURIDAD: Si falla el orden, los traemos sin ordenar pero no dejamos la pantalla en blanco
      if (error) {
        console.warn("Fallo el ordenamiento, trayendo datos en modo seguro...");
        const fallback = await supabase.from('reservas').select('*');
        data = fallback.data;
      }
      
      setTurnos(data || [])
    } catch (err) {
      console.error("Error fatal:", err)
    } finally {
      setLoading(false)
    }
  }

  async function eliminarTurno(id, nombre) {
    if (window.confirm(`¿Eliminar la cita de ${nombre}?`)) {
      const { error } = await supabase.from('reservas').delete().eq('id', id)
      if (!error) setTurnos(turnos.filter(t => t.id !== id))
    }
  }

  const turnosFiltrados = filtroBarbero === 'Todos' 
    ? turnos 
    : turnos.filter(t => t.barbero === filtroBarbero)

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <h1 className="text-3xl font-black tracking-tighter">AGENDA <span className="text-yellow-600">CHARLIE</span></h1>
          <div className="flex gap-2 flex-wrap justify-center">
            {nombresBarberos.map(n => (
              <button key={n} onClick={() => setFiltroBarbero(n)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${filtroBarbero === n ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>{n}</button>
            ))}
          </div>
        </header>

        {/* RED DE SEGURIDAD VISUAL */}
        {loading ? (
          <div className="text-center py-20 animate-pulse text-slate-400 font-bold tracking-widest">CARGANDO AGENDA...</div>
        ) : turnosFiltrados.length === 0 ? (
          <div className="bg-white p-12 rounded-[24px] text-center border border-slate-200 shadow-sm text-slate-400 font-medium">
            No hay citas para mostrar en esta categoría.
          </div>
        ) : (
          <div className="grid gap-4">
            {turnosFiltrados.map((t) => {
              // Extracción segura de la hora y fecha
              let fecha = 'Sin fecha';
              let hora = '00:00';
              
              if (t.fecha_hora) {
                const d = new Date(t.fecha_hora);
                if (!isNaN(d.getTime())) { // Si la fecha es válida
                  fecha = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                } else {
                  fecha = t.fecha_hora; // Si es un texto raro, lo pinta tal cual
                }
              }

              const nombre = t.cliente_nombre || t.cliente || 'Cliente';
              const tel = t.telefono ? t.telefono.replace(/\s+/g, '') : '';

              return (
                <div key={t.id} className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                  <div className="text-center md:text-left md:border-r border-slate-100 md:pr-8 min-w-[120px]">
                    <div className="text-3xl font-black text-slate-900 tracking-tighter">{hora}</div>
                    <div className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mt-1">{fecha}</div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.barbero || 'Charlie'}</p>
                    <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">{nombre}</h3>
                    <span className="inline-block mt-2 bg-slate-50 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-lg border border-slate-100">
                       ✂️ {t.servicio || 'Corte Clásico'}
                    </span>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <a href={`https://wa.me/${tel}?text=Hola%20${nombre},%20te%20escribo%20de%20Barbería%20Charlie.`} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-6 rounded-xl text-[10px] text-center shadow-lg shadow-green-100 transition-colors">WHATSAPP</a>
                    <button onClick={() => eliminarTurno(t.id, nombre)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors">🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}