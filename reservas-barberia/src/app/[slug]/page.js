"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation' 
import { supabase } from '../../lib/supabase' 

export default function FormularioNegocio() {
  const params = useParams()
  const slug = params.slug 

  const [negocio, setNegocio] = useState(null)
  const [barberosActivos, setBarberosActivos] = useState([]) 
  const [ausencias, setAusencias] = useState([]) 
  const [cargandoNegocio, setCargandoNegocio] = useState(true)

  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    barbero: '', 
    servicio: 'Corte Clásico',
    fecha: '',
    hora: ''
  })
  const [horasOcupadas, setHorasOcupadas] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [ticket, setTicket] = useState(null)

  const ALMUERZOS_BARBEROS = {
    'charlie': ['11:45'],
    'barbero 2': ['12:30'],
    'barbero 3': ['13:15'],
    'barbero 4': ['11:45']
  };

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: negocioData } = await supabase.from('negocios').select('*').eq('slug', slug).single()
      
      if (negocioData) {
        setNegocio(negocioData)

        const { data: empleadosData } = await supabase.from('empleados').select('*').eq('negocio_id', negocioData.id).eq('activo', true) 
        if (empleadosData && empleadosData.length > 0) {
          const barberosOrdenados = empleadosData.sort((a, b) => {
            const nomA = a.nombre.trim().toLowerCase();
            const nomB = b.nombre.trim().toLowerCase();
            if (nomA === 'charlie') return -1;
            if (nomB === 'charlie') return 1;
            return a.nombre.localeCompare(b.nombre);
          });
          setBarberosActivos(barberosOrdenados)
          setFormData(prev => ({ ...prev, barbero: barberosOrdenados[0].nombre }))
        } else {
          setBarberosActivos([]) 
        }

        const { data: ausenciasData } = await supabase.from('ausencias').select('*').eq('negocio_id', negocioData.id)
        if (ausenciasData) setAusencias(ausenciasData)
      }
      setCargandoNegocio(false)
    }
    if (slug) cargarDatos()
  }, [slug])

  const generarHorarios = () => {
    const horarios = []
    let h = 8, m = 0
    
    // Convertimos a minúscula y quitamos espacios para que coincida perfecto con la lista de arriba
    const nombreBarberoLimpio = formData.barbero ? formData.barbero.trim().toLowerCase() : '';
    const horasBloqueadas = ALMUERZOS_BARBEROS[nombreBarberoLimpio] || [];

    const generarHorarios = () => {
    const horarios = []
    let h = 8, m = 0
    
    // Convertimos a minúscula y quitamos espacios para que coincida perfecto con la lista de arriba
    const nombreBarberoLimpio = formData.barbero ? formData.barbero.trim().toLowerCase() : '';
    const horasBloqueadas = ALMUERZOS_BARBEROS[nombreBarberoLimpio] || [];

    while (h < 17 || (h === 17 && m === 0)) {
      const horaFormateada = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      
      if (!horasBloqueadas.includes(horaFormateada)) horarios.push(horaFormateada)
      
      m += 45
      if (m >= 60) { h++; m -= 60 }
    }
    return horarios
  }
    while (h < 17 || (h === 17 && m === 0)) {
      const horaFormateada = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      
      if (!horasBloqueadas.includes(horaFormateada)) horarios.push(horaFormateada)
      
      m += 45
      if (m >= 60) { h++; m -= 60 }
    }
    return horarios
  }

  const horariosDisponibles = generarHorarios()
  const esDiaLibre = ausencias.some(a => a.barbero === formData.barbero && a.fecha === formData.fecha);

  useEffect(() => {
    if (formData.fecha && formData.barbero && negocio && !esDiaLibre) {
      const consultarOcupados = async () => {
        const { data } = await supabase.from('reservas').select('fecha_hora').eq('barbero', formData.barbero).eq('negocio_id', negocio.id) 
        if (data) {
          const ocupadas = data
            .filter(d => d.fecha_hora && d.fecha_hora.includes(formData.fecha))
            .map(d => {
              const parteHora = d.fecha_hora.includes('T') ? d.fecha_hora.split('T')[1] : d.fecha_hora.split(' ')[1];
              return parteHora ? parteHora.substring(0, 5) : null;
            })
            .filter(Boolean);
          setHorasOcupadas(ocupadas);
        }
      }
      consultarOcupados()
    }
  }, [formData.fecha, formData.barbero, negocio, esDiaLibre])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  const seleccionarBarbero = (nombre) => setFormData({ ...formData, barbero: nombre, hora: '', fecha: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.hora) { setMensaje('⚠️ Por favor elige una hora'); return; }

    const telLimpio = formData.cliente_telefono.replace(/\D/g, ''); 
    if (telLimpio.length < 8) {
      setMensaje('⚠️ Por favor ingresa un WhatsApp válido (8 dígitos)');
      return;
    }

    setCargando(true)
    const codigoGenerado = 'CH-' + Math.random().toString(36).substring(2, 6).toUpperCase()

    const dataParaEnviar = {
      negocio_id: negocio.id,
      cliente_nombre: formData.cliente_nombre,
      cliente_telefono: formData.cliente_telefono,
      barbero: formData.barbero,
      servicio: formData.servicio,
      fecha_hora: `${formData.fecha} ${formData.hora}`,
      codigo: codigoGenerado 
    }

    const { error } = await supabase.from('reservas').insert([dataParaEnviar])

    if (error) {
      if (error.code === '23505') {
        setMensaje('❌ ¡Ups! Alguien más acaba de ganar este turno. Intenta con otra hora.');
      } else {
        setMensaje(`❌ Error real: ${error.message} (Cód: ${error.code})`);
      }
    } else {
      
      // ==========================================
      // MAGIA WHATSAPP: NOTIFICACIÓN AL ADMIN + AUTO-MENSAJE AL CLIENTE
      // ==========================================
      const numeroAdmin = "50376885349"; // <-- ¡PON TU NÚMERO AQUÍ!
      const apiKeyBot = "3741282";       // <-- ¡PON TU API KEY AQUÍ!

      const [anio, mes, dia] = formData.fecha.split('-');
      const fechaLocal = `${dia}/${mes}/${anio}`;

      const limpiarTildes = (texto) => {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      };

      // 1. Enviamos el mensaje en silencio a Charlie (vía CallMeBot)
      const mensajeCrudo = `¡NUEVA CITA EN TURNOPRO! ✂️📅\n\n*Cliente:* ${formData.cliente_nombre}\n*Servicio:* ${formData.servicio}\n*Barbero:* ${formData.barbero}\n*Fecha:* ${fechaLocal} a las ${formData.hora}\n*Tel:* ${formData.cliente_telefono}`;
      const textoMensaje = limpiarTildes(mensajeCrudo);
      
      try {
        await fetch(`https://api.callmebot.com/whatsapp.php?phone=${numeroAdmin}&text=${encodeURIComponent(textoMensaje)}&apikey=${apiKeyBot}`);
      } catch (err) {}

      // 2. Preparamos el Auto-Mensaje para el botón del cliente
      const barberoMayuscula = formData.barbero.charAt(0).toUpperCase() + formData.barbero.slice(1);
      
      const textoParaCharlie = `¡Hola! Soy ${formData.cliente_nombre}. Acabo de agendar en TurnoPro un ${formData.servicio} con ${barberoMayuscula} para el ${fechaLocal} a las ${formData.hora}. Mi código de reserva es #${codigoGenerado}. ¡Nos vemos!`;
      
      const urlWhatsAppCliente = `https://api.whatsapp.com/send?phone=${numeroAdmin}&text=${encodeURIComponent(textoParaCharlie)}`;
      // ==========================================
      
      // Guardamos el ticket inyectándole la URL mágica del WhatsApp
      setTicket({ ...formData, codigo: codigoGenerado, waUrl: urlWhatsAppCliente })
      setFormData({ ...formData, cliente_nombre: '', cliente_telefono: '', hora: '', fecha: '' })
      setMensaje('')
    }
    setCargando(false)
  }

  if (cargandoNegocio) return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans font-black tracking-widest text-gray-400">CARGANDO...</div>
  if (!negocio) return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold text-red-500">❌ Local no encontrado</div>

  return (
    <main className="min-h-screen bg-gray-100 p-4 flex items-center justify-center font-sans">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 relative overflow-hidden">
        {ticket ? (
          <div className="animate-in zoom-in duration-500">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><span className="text-3xl">✅</span></div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">¡Reserva Confirmada!</h2>
              <p className="text-sm font-bold text-slate-500 mt-2">Confirma tu cita en el botón de abajo 👇</p>
            </div>
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-6 mb-6 relative">
              <div className="absolute -left-4 top-1/2 w-8 h-8 bg-white rounded-full border-r-2 border-dashed border-gray-300 transform -translate-y-1/2"></div>
              <div className="absolute -right-4 top-1/2 w-8 h-8 bg-white rounded-full border-l-2 border-dashed border-gray-300 transform -translate-y-1/2"></div>
              <div className="text-center mb-6 border-b-2 border-dashed border-gray-200 pb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">CÓDIGO DE RESERVA</p>
                <p className="text-4xl font-black text-blue-600 tracking-tighter">#{ticket.codigo}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] font-black uppercase text-gray-400">Cliente</p><p className="text-base font-bold text-gray-900 truncate">{ticket.cliente_nombre}</p></div>
                <div><p className="text-[10px] font-black uppercase text-gray-400">Barbero</p><p className="text-base font-bold text-gray-900">{ticket.barbero}</p></div>
                <div><p className="text-[10px] font-black uppercase text-gray-400">Día</p><p className="text-base font-bold text-gray-900">{ticket.fecha}</p></div>
                <div><p className="text-[10px] font-black uppercase text-gray-400">Hora</p><p className="text-base font-bold text-yellow-600">{ticket.hora}</p></div>
                <div className="col-span-2 mt-2 pt-4 border-t border-gray-200"><p className="text-[10px] font-black uppercase text-gray-400">Servicio</p><p className="text-sm font-bold text-gray-700 bg-gray-100 py-2 px-3 rounded-lg inline-block mt-1">✂️ {ticket.servicio}</p></div>
              </div>
            </div>
            
            {/* NUEVO BOTÓN: Auto-Mensaje de WhatsApp para el cliente */}
            <a 
              href={ticket.waUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full flex justify-center items-center gap-2 bg-[#25D366] text-white font-black py-4 rounded-xl hover:bg-green-600 shadow-lg shadow-green-200 transition-all uppercase tracking-widest text-xs mb-3 active:scale-95"
            >
              <span className="text-lg">💬</span> Confirmar mi Cita por WhatsApp
            </a>

            <button onClick={() => setTicket(null)} className="w-full bg-gray-900 text-white font-black py-4 rounded-xl hover:bg-gray-800 transition-all uppercase tracking-widest text-xs active:scale-95">Hacer otra reserva</button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black text-center text-gray-900 mb-6 uppercase tracking-tight">{negocio.nombre}</h1>
            
            {barberosActivos.length === 0 ? (
              <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
                <span className="text-3xl block mb-2">🛑</span>
                <h3 className="font-black text-red-700 uppercase mb-1">Local Cerrado</h3>
                <p className="text-sm text-red-600 font-bold">Por el momento no hay barberos disponibles. Intenta más tarde.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-gray-900 text-xs font-black uppercase mb-1 ml-1">Tu Nombre</label><input type="text" name="cliente_nombre" value={formData.cliente_nombre} onChange={handleChange} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-black font-bold placeholder:text-gray-400" placeholder="Ej. Lucas" /></div>
                <div><label className="block text-gray-900 text-xs font-black uppercase mb-1 ml-1">WhatsApp</label><input type="tel" name="cliente_telefono" value={formData.cliente_telefono} onChange={handleChange} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-black font-bold placeholder:text-gray-400" placeholder="7000-0000" /></div>
                <div>
                  <label className="block text-gray-900 text-xs font-black uppercase mb-1 ml-1">Servicio</label>
                  <select name="servicio" value={formData.servicio} onChange={handleChange} className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white text-black font-bold">
                    <option value="Corte Clásico">Corte Clásico</option>
                    <option value="Corte + Barba">Corte + Barba</option>
                    <option value="Solo Barba">Solo Barba</option>
                    <option value="Corte para Niños">Corte para Niños 👶</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-900 text-xs font-black uppercase mb-2 ml-1 text-center">Selecciona tu Barbero</label>
                  <div className="flex gap-4 justify-center flex-wrap">
                    {barberosActivos.map((b) => (
                      <div key={b.id} onClick={() => seleccionarBarbero(b.nombre)} className={`flex flex-col items-center cursor-pointer p-2 rounded-2xl border-2 transition-all ${formData.barbero === b.nombre ? 'border-blue-600 bg-blue-50 shadow-md scale-105' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <img src={b.nombre.trim().toLowerCase() === 'charlie' ? '/charlie.png' : `https://ui-avatars.com/api/?name=${b.nombre.replace(' ', '+')}&background=random`} className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-white shadow-sm" alt={b.nombre} />
                        <span className="text-[10px] font-black uppercase text-gray-800 text-center">{b.nombre}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div><label className="block text-gray-900 text-xs font-black uppercase mb-1 ml-1">Día del corte</label><input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white text-black font-bold" /></div>
                
                {formData.fecha && (
                  <div className="animate-in fade-in zoom-in duration-300">
                    {esDiaLibre ? (
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center shadow-sm">
                        <span className="text-3xl block mb-2">🏖️</span>
                        <h3 className="font-black text-red-700 uppercase mb-1">Día Libre</h3>
                        <p className="text-xs text-red-600 font-bold leading-relaxed">{formData.barbero} no estará disponible en esta fecha. Por favor elige otro día u otro barbero para tu cita.</p>
                      </div>
                    ) : (
                      <>
                        <label className="block text-gray-900 text-xs font-black uppercase mb-2 ml-1">Horas disponibles</label>
                        <div className="grid grid-cols-3 gap-2">
                          {horariosDisponibles.map((h) => {
                            const estaOcupada = horasOcupadas.includes(h)
                            return (
                              <button key={h} type="button" disabled={estaOcupada} onClick={() => setFormData({ ...formData, hora: h })} className={`py-2 text-sm font-black rounded-xl border-2 transition-all ${estaOcupada ? 'bg-gray-100 text-gray-400 border-gray-200 line-through opacity-60' : formData.hora === h ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200/50 scale-105' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}>{h}</button>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {!esDiaLibre && (
                  <button type="submit" disabled={cargando} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all uppercase tracking-widest text-sm active:scale-95 disabled:bg-gray-400 mt-6">{cargando ? 'PROCESANDO...' : 'Confirmar Reserva'}</button>
                )}
              </form>
            )}
            {mensaje && <div className={`mt-6 p-4 text-center font-black rounded-xl border-2 text-sm ${mensaje.includes('✅') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{mensaje}</div>}
          </>
        )}
      </div>
    </main>
  )
}