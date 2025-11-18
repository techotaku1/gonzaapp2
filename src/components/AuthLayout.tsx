'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-screen w-full">
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="/fondo.jpg"
          alt="Login Background Left"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          quality={100}
          style={{
            objectFit: 'cover',
          }}
        />
        <div className="absolute inset-0" />
      </div>
      <div className="relative flex w-full items-center justify-center p-0 lg:w-1/2">
        <Image
          src="/fondoright.png"
          alt="Login Background Right"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          quality={100}
          style={{
            objectFit: 'cover',
            zIndex: -1,
          }}
        />
        <div className="absolute inset-0 bg-white/50" style={{ zIndex: -1 }} />
        <div className="scale-90 transform">{children}</div>
      </div>
    </div>
  );
}
