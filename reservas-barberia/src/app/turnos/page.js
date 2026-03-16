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
      let { data, error } = await supabase
        .from('reservas')
        .select('*')
        .order('fecha_hora', { ascending: true })
      
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

        {loading ? (
          <div className="text-center py-20 animate-pulse text-slate-400 font-bold tracking-widest">CARGANDO AGENDA...</div>
        ) : turnosFiltrados.length === 0 ? (
          <div className="bg-white p-12 rounded-[24px] text-center border-2 border-slate-300 shadow-lg text-slate-500 font-medium">
            No hay citas para mostrar en esta categoría.
          </div>
        ) : (
          <div className="grid gap-6">
            {turnosFiltrados.map((t) => {
              let fecha = 'Sin fecha';
              let hora = '00:00';
              
              if (t.fecha_hora) {
                const d = new Date(t.fecha_hora);
                if (!isNaN(d.getTime())) { 
                  fecha = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
                  hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                } else {
                  fecha = t.fecha_hora;
                }
              }

              const nombre = t.cliente_nombre || t.cliente || 'Cliente';
              const nombreBarbero = t.barbero || 'Charlie';
              
              let telLimpio = t.telefono ? t.telefono.replace(/\D/g, '') : '';
              if (telLimpio.length === 8) {
                telLimpio = '503' + telLimpio;
              }
              
              // AQUÍ ESTÁ EL MENSAJE ACTUALIZADO CON FECHA, HORA Y BARBERO
              const mensajeWhatsApp = t.codigo 
                ? `Hola ${nombre}, te confirmo tu cita en Barbería Charlie para el ${fecha} a las ${hora} con ${nombreBarbero}. Tu código es #${t.codigo}. ¡Te esperamos!`
                : `Hola ${nombre}, te escribo de Barbería Charlie para confirmar tu cita del ${fecha} a las ${hora} con ${nombreBarbero}.`;

              return (
                <div key={t.id} className="bg-white border-2 border-slate-300 rounded-[24px] p-6 shadow-md flex flex-col md:flex-row items-center gap-6 hover:shadow-xl transition-all">
                  <div className="text-center md:text-left md:border-r border-slate-200 md:pr-8 min-w-[120px]">
                    <div className="text-4xl font-black text-slate-900 tracking-tighter">{hora}</div>
                    <div className="text-sm font-bold text-yellow-600 uppercase tracking-widest mt-1">{fecha}</div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-2 mb-1 justify-center md:justify-start">
                      <p className="text-base font-black text-slate-600 uppercase tracking-widest">
                        <span className="text-slate-400 font-normal">Barbero:</span> {nombreBarbero}
                      </p>
                      {t.codigo && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest border border-blue-200">
                          #{t.codigo}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight">{nombre}</h3>
                    <span className="inline-block mt-3 bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg border border-slate-200">
                       ✂️ {t.servicio || 'Corte Clásico'}
                    </span>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <a 
                      href={`https://wa.me/${telLimpio}?text=${encodeURIComponent(mensajeWhatsApp)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 md:flex-none bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-6 rounded-xl text-xs text-center shadow-lg shadow-green-100 transition-colors"
                    >
                      WHATSAPP
                    </a>
                    <button onClick={() => eliminarTurno(t.id, nombre)} className="p-3 bg-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors">🗑️</button>
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