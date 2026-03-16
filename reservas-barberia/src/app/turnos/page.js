'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function TurnosAdmin() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  
  // ESTADOS DE FILTROS
  const [filtroBarbero, setFiltroBarbero] = useState('Todos')
  
  // Función para obtener la fecha de hoy en formato YYYY-MM-DD
  const getHoy = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // El filtro de fecha inicia por defecto en el día de hoy
  const [filtroFecha, setFiltroFecha] = useState(getHoy())

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

  // LÓGICA DE FILTRADO DOBLE (Por Barbero Y Por Fecha)
  const turnosFiltrados = turnos.filter(t => {
    const coincideBarbero = filtroBarbero === 'Todos' || t.barbero === filtroBarbero;
    
    let coincideFecha = true;
    if (filtroFecha && t.fecha_hora) {
      // Extraemos solo la parte de la fecha (YYYY-MM-DD) de la base de datos
      const fechaTurno = t.fecha_hora.includes('T') ? t.fecha_hora.split('T')[0] : t.fecha_hora.split(' ')[0];
      coincideFecha = fechaTurno === filtroFecha;
    }
    
    return coincideBarbero && coincideFecha;
  })

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* NUEVO DISEÑO DEL HEADER (Más estilo Dashboard) */}
        <header className="mb-8 bg-white p-6 rounded-[24px] shadow-sm border border-slate-200 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-6">
            <h1 className="text-3xl font-black tracking-tighter">AGENDA <span className="text-yellow-600">CHARLIE</span></h1>
            
            {/* CONTROLES DE FECHA */}
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">FECHA:</span>
              <input 
                type="date" 
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              />
              <button 
                onClick={() => setFiltroFecha('')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroFecha === '' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
              >
                Ver Todo
              </button>
            </div>
          </div>

          {/* CONTROLES DE BARBERO */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar por Barbero</span>
            <div className="flex gap-2 flex-wrap justify-center">
              {nombresBarberos.map(n => (
                <button key={n} onClick={() => setFiltroBarbero(n)} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${filtroBarbero === n ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>{n}</button>
              ))}
            </div>
          </div>
        </header>

        {/* CONTENIDO DE LA AGENDA */}
        {loading ? (
          <div className="text-center py-20 animate-pulse text-slate-400 font-bold tracking-widest">CARGANDO AGENDA...</div>
        ) : turnosFiltrados.length === 0 ? (
          <div className="bg-white p-12 rounded-[24px] text-center border-2 border-slate-200 shadow-sm flex flex-col items-center gap-3">
            <span className="text-4xl">📅</span>
            <h3 className="text-xl font-black text-slate-700">Agenda Libre</h3>
            <p className="text-slate-500 font-medium text-sm">No hay citas programadas para esta fecha y barbero.</p>
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
              
              const telefonoGuardado = t.cliente_telefono || t.telefono || '';
              let telLimpio = telefonoGuardado.replace(/\D/g, '');
              
              if (telLimpio.length === 8) {
                telLimpio = '503' + telLimpio; 
              } else if (telLimpio.length === 10) {
                telLimpio = '1' + telLimpio; 
              }
              
              const mensajeWhatsApp = t.codigo 
                ? `Hola ${nombre}, te confirmo tu cita en Barbería Charlie para el ${fecha} a las ${hora} con ${nombreBarbero}. Tu código es #${t.codigo}. ¡Te esperamos!`
                : `Hola ${nombre}, te escribo de Barbería Charlie para confirmar tu cita del ${fecha} a las ${hora} con ${nombreBarbero}.`;

              return (
                <div key={t.id} className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:shadow-md hover:border-blue-200 transition-all">
                  <div className="text-center md:text-left md:border-r border-slate-200 md:pr-8 min-w-[120px]">
                    <div className="text-4xl font-black text-slate-900 tracking-tighter">{hora}</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">{fecha}</div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-2 mb-1 justify-center md:justify-start">
                      <p className="text-sm font-black text-blue-600 uppercase tracking-widest">
                        {nombreBarbero}
                      </p>
                      {t.codigo && (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest border border-slate-200">
                          #{t.codigo}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight">{nombre}</h3>
                    <span className="inline-block mt-3 bg-slate-50 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200">
                       ✂️ {t.servicio || 'Corte Clásico'}
                    </span>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    {telLimpio ? (
                      <a 
                        href={`https://api.whatsapp.com/send?phone=${telLimpio}&text=${encodeURIComponent(mensajeWhatsApp)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex-1 md:flex-none bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-6 rounded-xl text-xs text-center shadow-md shadow-green-100 transition-colors"
                      >
                        WHATSAPP
                      </a>
                    ) : (
                      <button 
                        onClick={() => alert("Este cliente no tiene un número de teléfono registrado.")}
                        className="flex-1 md:flex-none bg-slate-100 text-slate-400 font-bold py-3 px-6 rounded-xl text-xs text-center cursor-not-allowed border border-slate-200"
                      >
                        SIN NÚMERO
                      </button>
                    )}
                    <button onClick={() => eliminarTurno(t.id, nombre)} className="p-3 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl border border-slate-200 transition-colors shadow-sm">🗑️</button>
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