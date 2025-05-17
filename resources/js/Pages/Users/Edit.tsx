import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import UserForm from './Form'

export default function Edit({ user, enterprises, roles }: any) {
  return (
    <AuthenticatedLayout>
      <Head title="Editar Usuario" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Editar Usuario</h1>
        <UserForm user={user} enterprises={enterprises} roles={roles} />
      </div>
    </AuthenticatedLayout>
  )
}
