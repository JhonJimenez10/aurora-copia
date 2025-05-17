import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import ArtPackgForm from './Form'

export default function Edit({ art_packg }: any) {
  return (
    <AuthenticatedLayout>
      <Head title="Editar Artículo Embalaje" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Editar Artículo</h1>
        <ArtPackgForm art_packg={art_packg} />
      </div>
    </AuthenticatedLayout>
  )
}