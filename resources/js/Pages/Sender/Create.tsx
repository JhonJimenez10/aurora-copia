import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import SenderForm from './Form'  // El formulario para crear Clientes Envío

export default function Create() {
  return (
    <AuthenticatedLayout>
      <Head title="Nuevo Cliente Envío" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Crear Cliente Envío</h1>
        <SenderForm />
      </div>
    </AuthenticatedLayout>
  )
}
