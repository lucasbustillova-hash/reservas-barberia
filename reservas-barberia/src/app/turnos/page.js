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
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .order('fecha_hora', { ascending: true })
      
      if (error) throw error
      setTurnos(data || [])
    } catch (err) {
      console.error("Error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  async function eliminarTurno(id, nombre) {
    if (window.confirm(`¿Eliminar cita de ${nombre}?`)) {
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
          <div className="flex gap-2">
            {nombresBarberos.map(n => (
              <button key={n} onClick={() => setFiltroBarbero(n)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${filtroBarbero === n ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}>{n}</button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 animate-pulse text-slate-400 font-bold">ACTUALIZANDO...</div>
        ) : (
          <div className="grid gap-4">
            {turnosFiltrados.map((t) => {
              const d = t.fecha_hora ? new Date(t.fecha_hora) : new Date();
              const fecha = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              const nombre = t.cliente_nombre || t.cliente || 'Cliente';

              return (
                <div key={t.id} className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
                  <div className="text-center md:text-left md:border-r border-slate-100 md:pr-8">
                    <div className="text-3xl font-black text-slate-900">{hora}</div>
                    <div className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">{fecha}</div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.barbero || 'Charlie'}</p>
                    <h3 className="text-xl font-extrabold text-slate-900 uppercase">{nombre}</h3>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <a href={`https://wa.me/${t.telefono?.replace(/\s+/g, '') || ''}`} target="_blank" className="flex-1 bg-[#25D366] text-white font-bold py-3 px-6 rounded-xl text-[10px] text-center shadow-lg shadow-green-100">WHATSAPP</a>
                    <button onClick={() => eliminarTurno(t.id, nombre)} className="p-3 bg-slate-50 text-slate-300 hover:text-red-500 rounded-xl border border-slate-100">🗑️</button>
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