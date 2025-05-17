import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import UserForm from './Form'

export default function Create({ enterprises, roles }: any) {
  return (
    <AuthenticatedLayout>
      <Head title="Crear Usuario" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Nuevo Usuario</h1>
        <UserForm enterprises={enterprises} roles={roles} />
      </div>
    </AuthenticatedLayout>
  )
}
