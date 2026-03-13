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
    const { data, error } = await supabase
      .from('reservas')
      .select('*')
      .order('fecha_hora', { ascending: true })
    
    if (error) {
      console.error(error)
      setTurnos([])
    } else {
      setTurnos(data || [])
    }
    setLoading(false)
  }

  async function eliminarTurno(id, nombre) {
    const confirmar = window.confirm(`¿Estás seguro de eliminar la cita de ${nombre}?`);
    if (confirmar) {
      const { error } = await supabase.from('reservas').delete().eq('id', id)
      if (error) {
        alert("Hubo un error al eliminar")
      } else {
        setTurnos(turnos.filter(t => t.id !== id))
      }
    }
  }

  // FUNCIÓN PARA FORMATEAR FECHA Y HORA (Día/Mes/Año)
  const formatearFechaHora = (isoString) => {
    if (!isoString) return { fecha: 'Sin fecha', hora: '00:00' };
    const d = new Date(isoString);
    
    // Formato Día/Mes/Año
    const fecha = d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Formato Hora:Minutos
    const hora = d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return { fecha, hora };
  }

  const turnosFiltrados = filtroBarbero === 'Todos' 
    ? turnos 
    : turnos.filter(t => t.barbero === filtroBarbero)

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-8 text-slate-800 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              AGENDA <span className="text-yellow-600">CHARLIE</span>
            </h1>
            <button onClick={fetchTurnos} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all">
              🔄
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {nombresBarberos.map(nombre => (
              <button
                key={nombre}
                onClick={() => setFiltroBarbero(nombre)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all border ${
                  filtroBarbero === nombre 
                  ? 'bg-yellow-500 text-white border-yellow-500 shadow-md' 
                  : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                {nombre}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 font-bold text-slate-400">Cargando agenda...</div>
        ) : turnosFiltrados.length === 0 ? (
          <div className="bg-white p-16 rounded-[32px] text-center border border-slate-100 shadow-sm text-slate-400">
            No hay citas para {filtroBarbero}
          </div>
        ) : (
          <div className="grid gap-6">
            {turnosFiltrados.map((t) => {
              const { fecha, hora } = formatearFechaHora(t.fecha_hora);
              const nombreReal = t.cliente_nombre || 'Cliente';
              const tel = t.telefono ? t.telefono.replace(/\s+/g, '') : '';
              
              return (
                <div 
                  key={t.id} 
                  className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow"
                >
                  {/* HORA Y FECHA: Ahora más suave y elegante */}
                  <div className="flex flex-col items-center md:items-start md:border-r border-slate-100 md:pr-8 min-w-[120px]">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{hora}</span>
                    <span className="text-sm font-bold text-yellow-600 uppercase tracking-widest">{fecha}</span>
                  </div>

                  {/* INFO CLIENTE */}
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {t.barbero || 'Charlie'}
                    </p>
                    <h3 className="text-2xl font-extrabold text-slate-900 uppercase leading-none mb-2">
                      {nombreReal}
                    </h3>
                    <span className="inline-block bg-slate-50 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-lg border border-slate-100">
                      ✂️ {t.servicio || 'Corte'}
                    </span>
                  </div>
                  
                  {/* ACCIONES */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <a 
                      href={`https://wa.me/${tel}?text=Hola%20${nombreReal},%20te%20escribo%20de%20Barbería%20Charlie.`}
                      target="_blank"
                      className="flex-1 md:flex-none bg-[#25D366] text-white font-bold py-4 px-8 rounded-2xl text-xs text-center hover:bg-[#128C7E] transition-colors shadow-lg shadow-green-100"
                    >
                      WHATSAPP
                    </a>
                    <button 
                      onClick={() => eliminarTurno(t.id, nombreReal)}
                      className="p-4 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl border border-slate-100 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}