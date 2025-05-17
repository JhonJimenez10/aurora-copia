import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import RecipientForm from './Form'

export default function Edit({ recipient }: any) {
  return (
    <AuthenticatedLayout>
      <Head title="Editar Destinatario" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Editar Destinatario</h1>
        <RecipientForm recipient={recipient} />
      </div>
    </AuthenticatedLayout>
  )
}
