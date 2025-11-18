'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { SignedIn, UserButton, useUser } from '@clerk/nextjs';

export default function Header() {
  const { user } = useUser();
  const [visible, setVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(currentScrollPos === 0);
    };
    window.addEventListener('scroll', handleScroll);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 z-[100] w-full overflow-x-hidden shadow-lg shadow-black/20 transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{
        width: '100vw',
        maxWidth: '100vw',
        minWidth: 0,
        background: '#fff',
      }}
    >
      <div className="absolute inset-0 -mt-60">
        <Image
          src="/banner.jpg"
          alt="Banner"
          fill
          sizes="100vw"
          className="object-cover object-top"
          quality={100}
          priority
        />
      </div>
      <div
        className={`relative z-[101] flex w-full items-center justify-between px-8 ${
          isMobile ? 'flex-col gap-2 px-2 py-2' : ''
        }`}
        style={isMobile ? { minWidth: 0, width: '100%' } : {}}
      >
        {/* Left section */}
        <div
          className={`flex items-center gap-6 ${
            isMobile ? 'w-full justify-between gap-2' : ''
          }`}
          style={isMobile ? { minWidth: 0 } : {}}
        >
          <SignedIn>
            <UserButton />
          </SignedIn>
          <h1
            className={`font-display font-bold tracking-tight text-white ${
              isMobile ? 'max-w-[120px] truncate text-base' : 'text-xl'
            }`}
            style={isMobile ? { maxWidth: 120, overflow: 'hidden' } : {}}
          >
            ¡Bienvenido, {user?.firstName ?? 'Usuario'}!
          </h1>
          <Image
            src="/logo2.png"
            alt="Logo"
            width={isMobile ? 48 : 90}
            height={isMobile ? 48 : 90}
            style={{
              width: isMobile ? '48px' : '90px',
              height: isMobile ? '48px' : '90px',
              minWidth: isMobile ? '32px' : '90px',
              minHeight: isMobile ? '32px' : '90px',
            }}
            className="object-contain"
            priority
          />
        </div>

        {/* Right section (puedes poner aquí la campana de notificación si la tienes) */}
        <div className={isMobile ? 'w-auto flex-shrink-0' : 'w-[200px]'} />
      </div>
    </header>
  );
}
