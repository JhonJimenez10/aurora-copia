// resources/js/Pages/Auth/Login.tsx

import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { MailIcon, LockIcon, ArrowRightIcon } from "lucide-react";

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        email: string;
        password: string;
        remember: boolean;
    }>({
        email: "",
        password: "",
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-black text-white">
            {/* Branding Section */}
            <div className="flex flex-col items-center justify-center w-full md:w-1/2 p-8 bg-gradient-to-br from-black via-red-700 to-black text-white">
                <div className="max-w-md mx-auto text-center">
                    <div className="relative w-72 h-20 rounded-full bg-white/10 mx-auto overflow-hidden mb-6 flex items-center">
                        <div className="absolute animate-slide-x w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="w-10 h-10 text-yellow-400"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M12 4V2M12 20v2M6.34 6.34L4.93 4.93M17.66 17.66l1.41 1.41M4 12H2M20 12h2M6.34 17.66l-1.41 1.41M17.66 6.34l1.41-1.41M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-2 text-yellow-400">
                        COURIER EXPRESS
                    </h1>
                    <p className="text-lg text-yellow-300 mb-8">
                        Sistema de gestión inteligente
                    </p>
                    <p className="text-yellow-200">
                        Plataforma avanzada para optimizar sus operaciones
                        empresariales
                    </p>
                </div>
            </div>

            {/* Login Form */}
            <div className="flex items-center justify-center w-full md:w-1/2 p-8 bg-black">
                <div className="w-full max-w-md space-y-6">
                    <Head title="Iniciar sesión" />
                    <div className="flex justify-center mb-4">
                        <img
                            src="/favicon.png"
                            alt="Aurora Express Logo"
                            className="w-44 h-44"
                        />
                    </div>

                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-500">
                            {status}
                        </div>
                    )}

                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white">
                            Bienvenido de nuevo
                        </h2>
                        <p className="text-gray-400">
                            Ingrese sus credenciales para acceder
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="email">
                                    Correo electrónico
                                </Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MailIcon className="h-5 w-5 text-yellow-400" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        className="pl-10 bg-black border-red-600 text-white focus:ring-red-700 focus:border-red-700"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-500 mt-1">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="password">Contraseña</Label>
                                    {/* {canResetPassword && (
                                        <Link
                                            href={route("password.request")}
                                            className="text-sm text-yellow-400 hover:text-yellow-300"
                                        >
                                            ¿Olvidó su contraseña?
                                        </Link>
                                    )} */}
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LockIcon className="h-5 w-5 text-yellow-400" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        className="pl-10 bg-black border-red-600 text-white focus:ring-red-700 focus:border-red-700"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        required
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-500 mt-1">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember"
                                name="remember"
                                type="checkbox"
                                className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-red-600 bg-black rounded"
                                checked={data.remember === true}
                                onChange={(e) =>
                                    setData(
                                        "remember",
                                        Boolean(e.target.checked)
                                    )
                                }
                            />
                            <label
                                htmlFor="remember"
                                className="ml-2 block text-sm text-white"
                            >
                                Recordarme
                            </label>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="group relative w-full flex justify-center py-3 bg-red-700 hover:bg-red-800"
                                disabled={processing}
                            >
                                <span className="flex items-center">
                                    Iniciar sesión
                                    <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
