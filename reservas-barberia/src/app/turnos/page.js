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
    const confirmar = window.confirm(`¿Estás seguro de que quieres eliminar el turno de ${nombre}?`);
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
    <div className="min-h-screen bg-gray-900 p-4 sm:p-8 text-white font-sans">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-8 border-b border-gray-800 pb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-yellow-500">
              Agenda <span className="text-white">Charlie</span>
            </h1>
            <button 
              onClick={fetchTurnos}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-lg transition-all border border-gray-700"
            >
              🔄
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {nombresBarberos.map(nombre => (
              <button
                key={nombre}
                onClick={() => setFiltroBarbero(nombre)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                  filtroBarbero === nombre 
                  ? 'bg-yellow-500 text-black border-yellow-500' 
                  : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}
              >
                {nombre}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
          </div>
        ) : turnosFiltrados.length === 0 ? (
          <div className="bg-gray-800/50 p-12 rounded-3xl text-center border-2 border-dashed border-gray-800">
            <p className="text-gray-500 text-lg">No hay citas para {filtroBarbero}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {turnosFiltrados.map((t) => {
              // Definimos el nombre real buscando en las columnas posibles
              const nombreReal = t.cliente_nombre || t.cliente || 'Sin nombre';
              
              return (
                <div 
                  key={t.id} 
                  className="bg-gray-800 border border-gray-700 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4"
                >
                  <div className="flex-1 w-full text-center md:text-left">
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-2">
                      <span className="bg-yellow-500 text-black font-black px-2 py-1 rounded-md text-sm">
                        {t.hora || '00:00'}
                      </span>
                      <span className="text-gray-400 font-medium text-sm">
                        {t.fecha_hora || 'Sin fecha'}
                      </span>
                      <span className="text-yellow-500/80 text-xs font-bold uppercase">
                        {t.barbero || 'Sin barbero'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white uppercase">{nombreReal}</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      <span className="text-gray-600">Servicio:</span> {t.servicio || 'General'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    {t.telefono && (
                      <a 
                        href={`https://wa.me/${t.telefono.replace(/\s+/g, '')}?text=Hola%20${nombreReal},%20te%20escribo%20de%20Barbería%20Charlie.`}
                        target="_blank"
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl text-center text-sm"
                      >
                        WhatsApp
                      </a>
                    )}
                    <button 
                      onClick={() => eliminarTurno(t.id, nombreReal)}
                      className="bg-red-900/20 text-red-500 p-3 rounded-xl border border-red-900/30"
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