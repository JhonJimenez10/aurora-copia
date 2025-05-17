import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, router } from '@inertiajs/react'
import { Button } from '@/Components/ui/button'

interface User {
  id: string
  name: string
  email: string
  enterprise: { name: string }
  role?: { name: string }
}

export default function UsersIndex({ users }: { users: User[] }) {
  return (
    <AuthenticatedLayout>
      <Head title="Usuarios del Sistema" />

      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
          <h1 className="text-2xl font-bold">Usuarios del Sistema</h1>
          <p className="text-purple-100 text-sm">Gestión de usuarios registrados en la plataforma</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-b-lg shadow-md">
          <div className="flex justify-end mb-4">
            <Link href="/users/create">
              <Button className="bg-green-600 hover:bg-green-700">
                + Nuevo Usuario
              </Button>
            </Link>
          </div>

          <div className="overflow-auto rounded-lg border border-slate-700">
            <table className="min-w-full text-sm text-white table-auto">
              <thead className="bg-purpleDark text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Empresa</th>
                  <th className="px-4 py-2 text-left">Rol</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-800">
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.enterprise?.name}</td>
                    <td className="px-4 py-2">{user.role?.name ?? '—'}</td>
                    <td className="px-4 py-2 space-x-2">
                      <Link href={`/users/${user.id}/edit`}>
                        <Button className="bg-purpleLight hover:bg-purpleDark text-white">
                          Editar
                        </Button>
                      </Link>
                      <Button
                        onClick={() => {
                          if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
                            router.delete(`/users/${user.id}`, { preserveScroll: true })
                          }
                        }}
                        className="bg-red-600 hover:bg-red-800 text-white"
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-400">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
