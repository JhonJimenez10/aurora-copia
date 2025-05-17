import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import RecipientForm from './Form'

export default function Create() {
  return (
    <AuthenticatedLayout>
      <Head title="Nuevo Destinatario" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Crear Destinatario</h1>
        <RecipientForm />
      </div>
    </AuthenticatedLayout>
  )
}
