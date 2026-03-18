'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function TurnosAdmin() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug

  const [autorizado, setAutorizado] = useState(false)
  const [negocio, setNegocio] = useState(null)
  const [turnos, setTurnos] = useState([])
  const [empleados, setEmpleados] = useState([]) // NUEVO: Estado para los barberos
  const [loading, setLoading] = useState(true)
  
  const [filtroBarbero, setFiltroBarbero] = useState('Todos')
  
  const getHoy = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  const [filtroFecha, setFiltroFecha] = useState(getHoy())

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // 1. EL GUARDIA DE SEGURIDAD
  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.push('/login')
      else setAutorizado(true)
    }
    verificarSesion()
  }, [router])

  // 2. CARGAR DATOS
  useEffect(() => {
    if (slug) cargarDatos()
  }, [slug])

  async function cargarDatos() {
    setLoading(true)
    try {
      // Buscar negocio
      const { data: negocioData, error: errorNegocio } = await supabase
        .from('negocios').select('*').eq('slug', slug).single()
      
      if (errorNegocio || !negocioData) {
        setLoading(false); return;
      }
      setNegocio(negocioData);

      // Buscar Turnos
      const { data: turnosData } = await supabase
        .from('reservas').select('*').eq('negocio_id', negocioData.id).order('fecha_hora', { ascending: true })
      setTurnos(turnosData || [])

      // Buscar Empleados (NUEVO)
      const { data: empleadosData } = await supabase
        .from('empleados').select('*').eq('negocio_id', negocioData.id).order('nombre', { ascending: true })
      setEmpleados(empleadosData || [])

    } catch (err) {
      console.error("Error fatal:", err)
    } finally {
      setLoading(false)
    }
  }

  // 3. FUNCIONES DE ACCIÓN
  async function eliminarTurno(id, nombre) {
    if (window.confirm(`¿Eliminar la cita de ${nombre}?`)) {
      const { error } = await supabase.from('reservas').delete().eq('id', id)
      if (!error) setTurnos(turnos.filter(t => t.id !== id))
    }
  }

  // NUEVO: Función para cambiar si el barbero trabaja o descansa
  async function toggleEstadoEmpleado(empleado) {
    const nuevoEstado = !empleado.activo;
    
    // Actualizamos la pantalla de inmediato (Efecto visual rápido)
    setEmpleados(empleados.map(emp => emp.id === empleado.id ? { ...emp, activo: nuevoEstado } : emp));

    // Mandamos el aviso a la base de datos
    const { error } = await supabase
      .from('empleados')
      .update({ activo: nuevoEstado })
      .eq('id', empleado.id);

    if (error) {
      alert("Hubo un error de conexión, intenta de nuevo.");
      cargarDatos(); // Si falla, recargamos los datos reales
    }
  }

  // 4. FILTROS
  const turnosFiltrados = turnos.filter(t => {
    const coincideBarbero = filtroBarbero === 'Todos' || t.barbero === filtroBarbero;
    let coincideFecha = true;
    if (filtroFecha && t.fecha_hora) {
      const fechaTurno = t.fecha_hora.includes('T') ? t.fecha_hora.split('T')[0] : t.fecha_hora.split(' ')[0];
      coincideFecha = fechaTurno === filtroFecha;
    }
    return coincideBarbero && coincideFecha;
  })

  // 5. PANTALLAS DE CARGA
  if (!autorizado) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold tracking-widest animate-pulse">VERIFICANDO SEGURIDAD 🔐...</div>
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold tracking-widest animate-pulse">CARGANDO AGENDA...</div>
  if (!negocio) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-red-500">❌ Local no encontrado</div>

  // 6. DISEÑO
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-8 bg-white p-6 rounded-[24px] shadow-sm border border-slate-200 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <h1 className="text-3xl font-black tracking-tighter uppercase">AGENDA <span className="text-yellow-600">{negocio.nombre}</span></h1>
              <button onClick={cerrarSesion} className="text-xs font-bold text-red-500 border border-red-100 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-all">Cerrar Sesión 🔒</button>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">FECHA:</span>
              <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl outline-none focus:border-blue-500 transition-all"/>
              <button onClick={() => setFiltroFecha('')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroFecha === '' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>Ver Todo</button>
            </div>
          </div>

          {/* ========================================== */}
          {/* NUEVA SECCIÓN: PANEL DE DISPONIBILIDAD */}
          {/* ========================================== */}
          <div className="flex flex-col items-center gap-3 border-b border-slate-100 pb-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Control de Asistencia (Hoy)</span>
            <div className="flex gap-3 flex-wrap justify-center">
              {empleados.map(emp => (
                <div key={emp.id} className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${emp.activo ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <span className={`text-sm font-bold ${emp.activo ? 'text-green-700' : 'text-red-700'}`}>{emp.nombre}</span>
                  <button 
                    onClick={() => toggleEstadoEmpleado(emp)}
                    className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all active:scale-95 ${emp.activo ? 'bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200' : 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200'}`}
                  >
                    {emp.activo ? 'TRABAJANDO ✅' : 'LIBRE ❌'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 pt-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar Agenda por Barbero</span>
            <div className="flex gap-2 flex-wrap justify-center">
              <button onClick={() => setFiltroBarbero('Todos')} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${filtroBarbero === 'Todos' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}>Todos</button>
              {/* Ahora los botones de filtro se generan a partir de tu tabla real */}
              {empleados.map(emp => (
                <button key={emp.id} onClick={() => setFiltroBarbero(emp.nombre)} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${filtroBarbero === emp.nombre ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{emp.nombre}</button>
              ))}
            </div>
          </div>
        </header>

        {turnosFiltrados.length === 0 ? (
          <div className="bg-white p-12 rounded-[24px] text-center border border-slate-200 shadow-sm flex flex-col items-center gap-3">
            <span className="text-4xl">📅</span>
            <h3 className="text-xl font-black text-slate-700">Agenda Libre</h3>
            <p className="text-slate-500 font-medium text-sm">No hay citas programadas para esta fecha y barbero.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {turnosFiltrados.map((t) => {
              let fecha = 'Sin fecha'; let hora = '00:00';
              if (t.fecha_hora) {
                const d = new Date(t.fecha_hora);
                if (!isNaN(d.getTime())) { 
                  fecha = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
                  hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                } else { fecha = t.fecha_hora; }
              }

              const nombre = t.cliente_nombre || t.cliente || 'Cliente';
              const nombreBarbero = t.barbero || 'Barbero';
              const telefonoGuardado = t.cliente_telefono || t.telefono || '';
              let telLimpio = telefonoGuardado.replace(/\D/g, '');
              if (telLimpio.length === 8) telLimpio = '503' + telLimpio; 
              else if (telLimpio.length === 10) telLimpio = '1' + telLimpio; 
              
              const mensajeWhatsApp = t.codigo 
                ? `Hola ${nombre}, te confirmo tu cita en ${negocio.nombre} para el ${fecha} a las ${hora} con ${nombreBarbero}. Tu código es #${t.codigo}. ¡Te esperamos!`
                : `Hola ${nombre}, te escribo de ${negocio.nombre} para confirmar tu cita del ${fecha} a las ${hora} con ${nombreBarbero}.`;

              return (
                <div key={t.id} className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-all">
                  <div className="text-center md:text-left md:border-r border-slate-200 md:pr-8 min-w-[120px]">
                    <div className="text-4xl font-black text-slate-900 tracking-tighter">{hora}</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">{fecha}</div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-sm font-black text-blue-600 uppercase tracking-widest mb-1">{nombreBarbero}</p>
                    <h3 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight">{nombre}</h3>
                    <span className="inline-block mt-3 bg-slate-50 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200">✂️ {t.servicio || 'Servicio'}</span>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    {telLimpio ? (
                      <a href={`https://api.whatsapp.com/send?phone=${telLimpio}&text=${encodeURIComponent(mensajeWhatsApp)}`} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none bg-[#25D366] text-white font-bold py-3 px-6 rounded-xl text-xs text-center shadow-md shadow-green-100">WHATSAPP</a>
                    ) : (
                      <button onClick={() => alert("Sin número registrado")} className="flex-1 md:flex-none bg-slate-100 text-slate-400 font-bold py-3 px-6 rounded-xl text-xs cursor-not-allowed">SIN NÚMERO</button>
                    )}
                    <button onClick={() => eliminarTurno(t.id, nombre)} className="p-3 bg-white text-slate-400 hover:text-red-600 rounded-xl border border-slate-200 shadow-sm">🗑️</button>
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