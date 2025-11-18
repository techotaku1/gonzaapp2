'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth } from '@clerk/nextjs';

const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutos

export default function ActivityMonitor() {
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        try {
          await signOut();
          router.push('/sign-in');
        } catch (error) {
          console.error('Error during auto sign-out:', error);
          router.push('/sign-in');
        }
      }, INACTIVE_TIMEOUT);
    };

    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Initial timer setup
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, true);
    });

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [router, signOut]);

  return null;
}
