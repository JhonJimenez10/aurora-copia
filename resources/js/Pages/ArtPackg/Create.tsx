import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import ArtPackgForm from './Form'

export default function Create() {
  return (
    <AuthenticatedLayout>
      <Head title="Nuevo Artículo Embalaje" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Crear Artículo</h1>
        <ArtPackgForm />
      </div>
    </AuthenticatedLayout>
  )
}
