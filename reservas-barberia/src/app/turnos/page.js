'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function TurnosAdmin() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroBarbero, setFiltroBarbero] = useState('Todos')

  // Estos nombres deben coincidir EXACTAMENTE con los de tu página principal
  const nombresBarberos = ['Todos', 'Charlie', 'Barbero 2', 'Barbero 3', 'Barbero 4']

  useEffect(() => {
    fetchTurnos()
  }, [])

  async function fetchTurnos() {
  setLoading(true)
  const { data, error } = await supabase
    .from('reservas')
    .select('*')
  
  if (error) {
    alert("Error de conexión: " + error.message) // Esto nos dirá si la tabla no existe o la llave está mal
  } else {
    alert("Conexión exitosa. Se encontraron " + data.length + " registros.") // Esto nos dirá si Supabase devuelve algo
    setTurnos(data)
  }
  setLoading(false)
}

  async function eliminarTurno(id, nombreCliente) {
    const confirmar = window.confirm(`¿Estás seguro de que quieres eliminar el turno de ${nombreCliente}? Esto liberará el espacio en la agenda.`);
    if (confirmar) {
      const { error } = await supabase.from('reservas').delete().eq('id', id)
      if (error) {
        alert("Hubo un error al eliminar")
      } else {
        setTurnos(turnos.filter(t => t.id !== id))
      }
    }
  }

  // Lógica para filtrar la lista según el botón seleccionado
  const turnosFiltrados = filtroBarbero === 'Todos' 
    ? turnos 
    : turnos.filter(t => t.barbero === filtroBarbero)

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-8 text-white font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* ENCABEZADO */}
        <header className="mb-8 border-b border-gray-800 pb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-yellow-500">
              Agenda <span className="text-white">Charlie</span>
            </h1>
            <button 
              onClick={fetchTurnos}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-lg transition-all border border-gray-700"
              title="Actualizar lista"
            >
              🔄
            </button>
          </div>
          
          {/* FILTROS POR BARBERO */}
          <div className="flex flex-wrap gap-2">
            {nombresBarberos.map(nombre => (
              <button
                key={nombre}
                onClick={() => setFiltroBarbero(nombre)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                  filtroBarbero === nombre 
                  ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/20 scale-105' 
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                }`}
              >
                {nombre}
              </button>
            ))}
          </div>
        </header>

        {/* LISTA DE TURNOS */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
          </div>
        ) : turnosFiltrados.length === 0 ? (
          <div className="bg-gray-800/50 p-12 rounded-3xl text-center border-2 border-dashed border-gray-800">
            <p className="text-gray-500 text-lg">No hay citas para {filtroBarbero === 'Todos' ? 'hoy' : filtroBarbero}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {turnosFiltrados.map((t) => (
              <div 
                key={t.id} 
                className="bg-gray-800 border border-gray-700 p-5 rounded-2xl shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4 hover:border-gray-500 transition-colors"
              >
                <div className="flex-1 w-full text-center md:text-left">
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-2">
                    <span className="bg-yellow-500 text-black font-black px-2 py-1 rounded-md text-sm">
                      {t.hora}
                    </span>
                    <span className="text-gray-400 font-medium text-sm">{t.fecha}</span>
                    <span className="text-gray-600 hidden md:block">|</span>
                    <span className="text-yellow-500/80 text-xs font-bold uppercase tracking-widest">
                      {t.barbero}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tight">{t.cliente}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    <span className="text-gray-600">Servicio:</span> {t.servicio}
                  </p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                  <a 
                    href={`https://wa.me/${t.telefono.replace(/\s+/g, '')}?text=Hola%20${t.cliente},%20te%20escribo%20de%20Barbería%20Charlie%20para%20confirmar%20tu%20cita%20a%20las%20${t.hora}.`}
                    target="_blank"
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm"
                  >
                    <span>WhatsApp</span>
                  </a>
                  <button 
                    onClick={() => eliminarTurno(t.id, t.cliente)}
                    className="bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white p-3 rounded-xl transition-colors border border-red-900/30"
                    title="Eliminar turno"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}