import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import SenderForm from './Form'  // El formulario para Clientes Envío

export default function Edit({ sender }: any) {
  return (
    <AuthenticatedLayout>
      <Head title="Editar Cliente Envío" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Editar Cliente Envío</h1>
        <SenderForm sender={sender} />
      </div>
    </AuthenticatedLayout>
  )
}
