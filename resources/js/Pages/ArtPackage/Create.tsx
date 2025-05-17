import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import ArtPackageForm from './Form'

export default function Create() {
  return (
    <AuthenticatedLayout>
      <Head title="Nuevo Artículo por Agencia" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Crear Artículo</h1>
        <ArtPackageForm />
      </div>
    </AuthenticatedLayout>
  )
}
