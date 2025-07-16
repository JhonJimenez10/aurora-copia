import DangerButton from "@/Components/DangerButton";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import Modal from "@/Components/Modal";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";
import { useForm } from "@inertiajs/react";
import { FormEventHandler, useRef, useState } from "react";

export default function DeleteUserForm({
    className = "",
}: {
    className?: string;
}) {
    const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: "",
    });

    const confirmar = () => {
        setConfirmarEliminacion(true);
    };

    const eliminarUsuario: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route("profile.destroy"), {
            preserveScroll: true,
            onSuccess: () => cerrarModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const cerrarModal = () => {
        setConfirmarEliminacion(false);
        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-white">
                    Eliminar Cuenta
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                    Una vez que se elimine tu cuenta, todos sus datos serán
                    borrados permanentemente. Antes de proceder, asegúrate de
                    descargar cualquier información que desees conservar.
                </p>
            </header>

            <DangerButton
                onClick={confirmar}
                className="bg-red-700 hover:bg-red-800 text-white"
            >
                Eliminar Cuenta
            </DangerButton>

            <Modal show={confirmarEliminacion} onClose={cerrarModal}>
                <form
                    onSubmit={eliminarUsuario}
                    className="p-6 bg-black border border-red-700 rounded-lg"
                >
                    <h2 className="text-lg font-medium text-white">
                        ¿Estás seguro de que deseas eliminar tu cuenta?
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                        Una vez que elimines tu cuenta, todos tus datos serán
                        eliminados de forma permanente. Por favor, ingresa tu
                        contraseña para confirmar que deseas eliminar tu cuenta.
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Contraseña"
                            className="text-white"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            className="mt-1 block w-full bg-black border border-red-700 text-white"
                            isFocused
                            placeholder="Contraseña"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton
                            onClick={cerrarModal}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black"
                        >
                            Cancelar
                        </SecondaryButton>

                        <DangerButton
                            className="ms-3 bg-red-700 hover:bg-red-800 text-white"
                            disabled={processing}
                        >
                            Confirmar Eliminación
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
