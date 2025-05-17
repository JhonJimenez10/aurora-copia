import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import EnterpriseForm from './Form'

export default function Create() {
  return (
    <AuthenticatedLayout>
      <Head title="Nueva Empresa" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Crear Empresa</h1>
        <EnterpriseForm />
      </div>
    </AuthenticatedLayout>
  )
}
