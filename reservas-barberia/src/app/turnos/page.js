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
      const { data: dataSinOrden } = await supabase.from('reservas').select('*')
      setTurnos(dataSinOrden || [])
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

  const turnosFiltrados = filtroBarbero === 'Todos' 
    ? turnos 
    : turnos.filter(t => t.barbero === filtroBarbero)

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* ENCABEZADO ESTILO MODERNO */}
        <header className="mb-10 text-center md:text-left">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900">
                AGENDA <span className="text-yellow-600">CHARLIE</span>
              </h1>
              <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Panel de Administración</p>
            </div>
            <button 
              onClick={fetchTurnos}
              className="bg-white hover:bg-slate-50 text-slate-600 p-3 rounded-2xl shadow-sm border border-slate-200 transition-all active:scale-95"
            >
              🔄
            </button>
          </div>
          
          {/* FILTROS TIPO CAPSULA */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {nombresBarberos.map(nombre => (
              <button
                key={nombre}
                onClick={() => setFiltroBarbero(nombre)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
                  filtroBarbero === nombre 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
              >
                {nombre}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900"></div>
          </div>
        ) : turnosFiltrados.length === 0 ? (
          <div className="bg-white p-16 rounded-[40px] text-center shadow-sm border border-slate-100">
            <p className="text-slate-400 font-medium italic">No hay citas programadas para {filtroBarbero}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {turnosFiltrados.map((t) => {
              const nombreReal = t.cliente_nombre || t.cliente || 'Sin nombre';
              const tel = t.telefono ? t.telefono.replace(/\s+/g, '') : '';
              
              return (
                <div 
                  key={t.id} 
                  className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all flex flex-col md:flex-row items-stretch"
                >
                  {/* BLOQUE HORA: Destacado en negro/oscuro para contraste */}
                  <div className="bg-slate-900 text-white p-8 flex flex-col justify-center items-center md:w-44 text-center">
                    <span className="text-xs font-bold opacity-50 mb-1 tracking-tighter">HORARIO</span>
                    <span className="text-4xl font-black tracking-tighter">{t.hora || '00:00'}</span>
                    <span className="text-[10px] font-bold mt-2 bg-white/10 px-3 py-1 rounded-full">
                      {t.fecha_hora || 'Pendiente'}
                    </span>
                  </div>

                  {/* BLOQUE INFO */}
                  <div className="p-8 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-yellow-600 text-[10px] font-black uppercase tracking-widest">
                        Barbero: {t.barbero || 'Charlie'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight mb-2">
                      {nombreReal}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">
                        🏷️ {t.servicio || 'Servicio estándar'}
                      </span>
                    </div>
                  </div>
                  
                  {/* BLOQUE ACCIONES */}
                  <div className="px-8 pb-8 md:pb-0 md:px-8 flex items-center gap-3">
                    <a 
                      href={`https://wa.me/${tel}?text=Hola%20${nombreReal},%20te%20escribo%20de%20Barbería%20Charlie.`}
                      target="_blank"
                      className="flex-1 md:flex-none bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 px-8 rounded-2xl text-xs transition-all shadow-lg shadow-green-200 active:scale-95"
                    >
                      WHATSAPP
                    </a>
                    <button 
                      onClick={() => eliminarTurno(t.id, nombreReal)}
                      className="bg-red-50 hover:bg-red-100 text-red-500 p-4 rounded-2xl transition-colors border border-red-100"
                      title="Eliminar cita"
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