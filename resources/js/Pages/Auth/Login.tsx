import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { MailIcon, LockIcon, ArrowRightIcon } from 'lucide-react';

export default function Login({ status, canResetPassword }: { status?: string; canResetPassword: boolean }) {
  const { data, setData, post, processing, errors, reset } = useForm<{
    email: string;
    password: string;
    remember: boolean;
  }>({
    email: '',
    password: '',
    remember: false,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('login'), {
      onFinish: () => reset('password'),
    });
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Branding Section */}
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 p-8 bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-600 text-white">
        <div className="max-w-md mx-auto text-center">
          {/* Sol animado con estela */}
          <div className="relative w-72 h-20 rounded-full bg-white/10 mx-auto overflow-hidden mb-6 flex items-center">
            <div className="absolute animate-slide-x w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shadow-glow">
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white" stroke="currentColor" strokeWidth="2">
                <path d="M12 4V2M12 20v2M6.34 6.34L4.93 4.93M17.66 17.66l1.41 1.41M4 12H2M20 12h2M6.34 17.66l-1.41 1.41M17.66 6.34l1.41-1.41M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>



          <h1 className="text-4xl md:text-5xl font-bold mb-2">AURORA EXPRESS</h1>
          <p className="text-lg text-white/80 mb-8">Sistema de gestión inteligente</p>
          <p className="text-white/70">Plataforma avanzada para optimizar sus operaciones empresariales con tecnología de vanguardia</p>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex items-center justify-center w-full md:w-1/2 p-8 bg-white">
        <div className="w-full max-w-md space-y-6">
          <Head title="Iniciar sesión" />
          {/* Logo encima del formulario */}
          <div className="flex justify-center mb-4">
            <img
              src="/favicon.png"
              alt="Aurora Express Logo"
              className="w-44 h-44" // Aumentado de w-16 h-16 a w-24 h-24
            />
          </div>
          {status && <div className="mb-4 text-sm font-medium text-green-600">{status}</div>}

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Bienvenido de nuevo</h2>
            <p className="text-gray-600">Ingrese sus credenciales para acceder</p>
          </div>


          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MailIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    className="pl-10 bg-gray-50 border-gray-300 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    required
                  />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  {canResetPassword && (
                    <Link
                      href={route('password.request')}
                      className="text-sm text-purple-600 hover:text-purple-500"
                    >
                      ¿Olvidó su contraseña?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    className="pl-10 bg-gray-50 border-gray-300 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    required
                  />
                  {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                checked={data.remember === true}
                onChange={(e) => setData('remember', Boolean(e.target.checked))}
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Recordarme
              </label>
            </div>

            <div>
              <Button
                type="submit"
                className="group relative w-full flex justify-center py-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                disabled={processing}
              >
                <span className="flex items-center">
                  Iniciar sesión
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
