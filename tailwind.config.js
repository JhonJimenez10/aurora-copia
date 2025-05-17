import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class', 'class'], // Asegura que el modo oscuro esté activado
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            colors: {
                // Colores oscuros personalizados
                dark: "#121212", // Negro puro
                darkPurple: "#1a1a2e", // Morado muy oscuro
                purpleDark: "#5d2a75", // Morado oscuro
                purpleLight: "#8e44ad", // Morado más claro
                background: "#121212", // Fondo oscuro
                foreground: "#ffffff", // Texto blanco para contraste
                
                // Modificación de los colores existentes
                primary: {
                    DEFAULT: "#8e44ad", // Morado principal
                    foreground: "#ffffff", // Texto blanco
                },
                secondary: {
                    DEFAULT: "#5d2a75", // Morado oscuro
                    foreground: "#ffffff",
                },
                muted: {
                    DEFAULT: "#2c2c54", // Azul oscuro para resaltar
                    foreground: "#bdbdbd", // Gris claro
                },
                accent: {
                    DEFAULT: "#9b59b6", // Morado vibrante
                    foreground: "#ffffff",
                },
                destructive: {
                    DEFAULT: "#e74c3c", // Rojo para acciones destructivas
                    foreground: "#ffffff",
                },
                border: "#5d2a75", // Bordes en morado oscuro
                input: "#2c2c54", // Inputs con fondo oscuro
                ring: "#8e44ad", // Efecto de enfoque en morado
            },
        },
    },

    plugins: [forms, require("tailwindcss-animate")],
};
