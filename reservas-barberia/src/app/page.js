import Link from 'next/link'

export default function LandingPage() {
  // Cambia este número por tu WhatsApp real (con el código de país 503)
  const miWhatsApp = "50376885349"
  const mensajeVentas = "¡Hola! Visité la página de tu sistema de reservas y me gustaría solicitar una demostración para mi negocio."

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
      
      {/* 1. NAVEGACIÓN */}
      <nav className="flex justify-between items-center p-6 md:px-12 bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
          <span className="bg-blue-600 text-white p-1.5 rounded-lg text-sm">🗓️</span>
          TurnoPro <span className="text-blue-600 text-sm font-bold ml-1 px-2 py-0.5 bg-blue-50 rounded-full">SaaS</span>
        </div>
        <a 
          href={`https://api.whatsapp.com/send?phone=${miWhatsApp}&text=${encodeURIComponent(mensajeVentas)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
        >
          Solicitar Demo
        </a>
      </nav>

      {/* 2. HERO SECTION (El Gancho) */}
      <header className="px-6 py-20 md:py-32 text-center flex flex-col items-center justify-center bg-white relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-[20%] right-[-5%] w-72 h-72 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 max-w-3xl">
          <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-4 block">Automatización de tiempo al 100%</span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 leading-tight">
            Tu negocio abierto <span className="text-blue-600">24/7.</span> Sin complicaciones.
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 font-medium max-w-2xl mx-auto leading-relaxed">
            El sistema de agendamiento inteligente diseñado para profesionales que valoran su tiempo. Olvídate de los choques de horarios, los mensajes de WhatsApp a deshoras y los cuadernos de papel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={`https://api.whatsapp.com/send?phone=${miWhatsApp}&text=${encodeURIComponent(mensajeVentas)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              Hablar con un asesor
            </a>
          </div>
        </div>
      </header>

      {/* 3. PROBLEMA Y SOLUCIÓN (Beneficios) */}
      <section className="py-20 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Todo lo que necesitas para operar en piloto automático</h2>
          <p className="text-slate-500 font-medium">Diseñado a la medida de la realidad de los negocios en El Salvador.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="text-4xl mb-4 bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center">🛡️</div>
            <h3 className="text-xl font-black mb-3">Escudo Anti-Choques</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">Nuestro sistema bloquea automáticamente las horas ocupadas en tiempo real. Es matemáticamente imposible que dos clientes reserven el mismo turno.</p>
          </div>
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="text-4xl mb-4 bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center">📲</div>
            <h3 className="text-xl font-black mb-3">Enlace Propio</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">Te entregamos un enlace único con el nombre de tu marca (ej: mi-negocio.com/mi-local) listo para poner en tu biografía de Instagram o Facebook.</p>
          </div>
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="text-4xl mb-4 bg-yellow-50 w-16 h-16 rounded-2xl flex items-center justify-center">☕</div>
            <h3 className="text-xl font-black mb-3">Logística Operativa</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">Soporte para múltiples colaboradores en un mismo local, con horarios de almuerzo y descansos configurables para que nadie se quede sin comer.</p>
          </div>
        </div>
      </section>

      {/* 4. CASOS DE USO (A quién va dirigido) */}
      <section className="py-20 px-6 md:px-12 bg-slate-900 text-white rounded-[40px] max-w-6xl mx-auto my-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Una solución adaptable a cualquier industria</h2>
            <p className="text-slate-400 font-medium">No importa tu rubro, si dependes de una agenda, este sistema es para ti.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
              <div className="text-4xl mb-3">🩺</div>
              <h4 className="font-bold text-sm tracking-wide">Clínicas Pediátricas y Médicas</h4>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
              <div className="text-4xl mb-3">⚖️</div>
              <h4 className="font-bold text-sm tracking-wide">Despachos Legales</h4>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
              <div className="text-4xl mb-3">💼</div>
              <h4 className="font-bold text-sm tracking-wide">Asesores de Seguros</h4>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
              <div className="text-4xl mb-3">✂️</div>
              <h4 className="font-bold text-sm tracking-wide">Salones y Barberías</h4>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER / CIERRE */}
      <footer className="py-12 px-6 text-center">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-6">¿Listo para dar el salto digital?</h2>
        <a 
          href={`https://api.whatsapp.com/send?phone=${miWhatsApp}&text=${encodeURIComponent(mensajeVentas)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 mb-12"
        >
          Contáctanos hoy
        </a>
        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">© {new Date().getFullYear()} TurnoPro Software. Desarrollado en El Salvador.</p>
      </footer>

    </div>
  )
}