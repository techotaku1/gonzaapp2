'use client';

import React, { useState } from 'react';

import Image from 'next/image';

import { useClerk, useSignIn } from '@clerk/nextjs';

import AuthLayout from '~/components/AuthLayout';

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const { signIn } = useSignIn();
  const clerk = useClerk();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!email) return setError('El correo es obligatorio');
    if (!password) return setError('La contraseña es obligatoria');
    setLoading(true);

    try {
      if (!signIn) {
        setError('Error de configuración de Clerk. Revisa las keys.');
        return;
      }

      // Crear el intento de inicio de sesión
      const result = await signIn.create({
        identifier: email,
        password,
      });

      console.log('Estado del sign-in:', result.status);
      console.log('Factores soportados:', result.supportedFirstFactors);

      // Si el estado es "needs_first_factor", intentar completarlo con password
      if (result.status === 'needs_first_factor') {
        const attemptResult = await signIn.attemptFirstFactor({
          strategy: 'password',
          password: password,
        });

        if (attemptResult.status === 'complete') {
          await clerk.setActive({ session: attemptResult.createdSessionId });
          window.location.href = '/';
          return;
        }
      }

      // Si ya está completo desde el inicio
      if (result.status === 'complete') {
        await clerk.setActive({ session: result.createdSessionId });
        window.location.href = '/';
        return;
      }

      // Si requiere segundo factor
      if (result.status === 'needs_second_factor') {
        // Preparar el envío del código por email
        await signIn.prepareSecondFactor({ strategy: 'email_code' });
        setShowCodeInput(true);
        setError('Ingresa el código enviado a tu email.');
        return;
      }

      // Otros estados que requieren más pasos
      setError(`Estado no manejado: ${result.status}`);
    } catch (err: unknown) {
      console.error('Error al iniciar sesión:', err);
      const e = err as { errors?: { message?: string }[]; message?: string };
      let errorMessage =
        e?.errors?.[0]?.message ?? e?.message ?? 'Error desconocido.';

      // Traducir mensajes comunes de Clerk
      if (errorMessage.includes("Couldn't find your account")) {
        errorMessage = 'No se encontró tu cuenta.';
      } else if (errorMessage.includes('Password is incorrect')) {
        errorMessage = 'La contraseña es incorrecta.';
      } else if (errorMessage.includes('Try again, or use another method')) {
        errorMessage = 'Inténtalo de nuevo o usa otro método.';
      } else if (errorMessage.includes('Identifier is invalid')) {
        errorMessage = 'El identificador es inválido.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!code) return setError('El código es obligatorio');
    if (!signIn) {
      setError('Error de configuración de Clerk.');
      return;
    }
    setLoading(true);

    try {
      const attemptResult = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code,
      });

      if (attemptResult.status === 'complete') {
        await clerk.setActive({ session: attemptResult.createdSessionId });
        window.location.href = '/';
      } else {
        setError('Código incorrecto.');
      }
    } catch (err: unknown) {
      console.error('Error al verificar código:', err);
      const e = err as { errors?: { message?: string }[]; message?: string };
      let errorMessage =
        e?.errors?.[0]?.message ?? e?.message ?? 'Error al verificar código.';

      // Traducir mensajes comunes de Clerk
      if (errorMessage.includes("Couldn't find your account")) {
        errorMessage = 'No se encontró tu cuenta.';
      } else if (errorMessage.includes('Password is incorrect')) {
        errorMessage = 'La contraseña es incorrecta.';
      } else if (errorMessage.includes('Try again, or use another method')) {
        errorMessage = 'Inténtalo de nuevo o usa otro método.';
      } else if (errorMessage.includes('Code is incorrect')) {
        errorMessage = 'El código es incorrecto.';
      } else if (errorMessage.includes('Identifier is invalid')) {
        errorMessage = 'El identificador es inválido.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="grid w-full flex-grow items-center px-4 sm:justify-center">
        <form
          onSubmit={handleLogin}
          className="w-full space-y-8 sm:w-96"
          autoComplete="off"
        >
          <header className="text-center">
            <h1 className="font-display mb-4 text-5xl font-bold tracking-tight text-indigo-600">
              GonzaApp
            </h1>
            <div className="relative mx-auto h-24 w-24">
              <Image
                src="/logo2.png"
                alt="Logo"
                fill
                priority
                sizes="(max-width: 96px) 100vw, 96px"
                style={{ objectFit: 'contain' }}
                quality={100}
              />
            </div>
            <h2 className="mt-4 text-xl font-medium tracking-tight text-neutral-950">
              {showCodeInput ? 'Verificar Código' : 'Iniciar Sesión'}
            </h2>
          </header>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <input
                type="email"
                required
                placeholder="Correo electrónico"
                className="w-full border-b-2 border-black bg-transparent px-0 py-2 font-bold text-white placeholder:text-black/30 focus:border-indigo-500 focus:ring-0 focus:outline-none"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Contraseña"
                className="w-full border-b-2 border-black bg-transparent px-0 py-2 pr-10 font-bold text-white placeholder:text-black/30 focus:border-indigo-500 focus:ring-0 focus:outline-none"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-700 hover:text-white"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative flex h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                'Ingresar'
              )}
            </button>
          </div>
        </form>

        {showCodeInput && (
          <form
            onSubmit={handleVerifyCode}
            className="w-full space-y-8 sm:w-96"
          >
            <div className="space-y-6">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Código de verificación"
                  className="w-full border-b-2 border-black bg-transparent px-0 py-2 font-bold text-white placeholder:text-black/30 focus:border-indigo-500 focus:ring-0 focus:outline-none"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="relative flex h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
