"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const router = useRouter()

  const iniciarSesion = async (e) => {
    e.preventDefault()
    setMensaje('Verificando credenciales...')

    // 1. Validar correo y contraseña con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      setMensaje('Error: Correo o contraseña incorrectos.')
      return
    }

    // 2. Buscar a qué negocio pertenece este correo
    const { data: negocio, error: errorNegocio } = await supabase
      .from('negocios')
      .select('slug')
      .eq('email_admin', email)
      .single()

    if (negocio) {
      setMensaje('¡Éxito! Entrando a tu panel...')
      // 3. Redirigir al usuario automáticamente a SU panel privado
      router.push(`/${negocio.slug}/turnos`)
    } else {
      setMensaje('Este usuario no tiene un local asignado.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4 bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">🔐</div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Iniciar Sesión</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Accede al panel de tu negocio</p>
        </div>

        <form onSubmit={iniciarSesion} className="flex flex-col gap-5">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 font-medium"
              placeholder="ejemplo@correo.com"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          {mensaje && (
            <p className="text-center text-sm font-bold text-blue-600 bg-blue-50 p-3 rounded-xl animate-pulse">
              {mensaje}
            </p>
          )}

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl mt-2 transition-all active:scale-95 shadow-md uppercase text-sm tracking-widest"
          >
            Entrar al Sistema
          </button>
        </form>
      </div>
    </div>
  )
}