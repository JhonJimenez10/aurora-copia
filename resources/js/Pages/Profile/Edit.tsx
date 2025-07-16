import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-white">
                    Editar Perfil
                </h2>
            }
        >
            <Head title="Editar Perfil" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* Encabezado con gradiente */}
                    <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg shadow-md">
                        <h1 className="text-2xl font-bold">
                            Perfil de Usuario
                        </h1>
                        <p className="text-white text-sm">
                            Desde aquí puedes modificar tu información de perfil
                            y credenciales.
                        </p>
                    </div>

                    {/* Información del perfil */}
                    <div className="bg-black border border-red-700 p-6 rounded-lg shadow-md">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl text-white"
                        />
                    </div>

                    {/* Cambio de contraseña */}
                    <div className="bg-black border border-red-700 p-6 rounded-lg shadow-md">
                        <UpdatePasswordForm className="max-w-xl text-white" />
                    </div>

                    {/* Eliminación de cuenta */}
                    <div className="bg-black border border-red-700 p-6 rounded-lg shadow-md">
                        <DeleteUserForm className="max-w-xl text-white" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
