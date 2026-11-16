import { useState, useEffect, useCallback } from 'react';

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    } else {
      setIsSupported(false);
      setPermission('unsupported');
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }, []);

  const triggerLocalNotification = useCallback(
    (title: string, options?: NotificationOptions): boolean => {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return false;
      }

      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
              icon: '/pwa-192x192.png',
              badge: '/icon.svg',
              vibrate: [200, 100, 200],
              ...options,
            } as NotificationOptions);
          });
          return true;
        } else {
          new Notification(title, {
            icon: '/pwa-192x192.png',
            ...options,
          });
          return true;
        }
      } catch (err) {
        console.warn('Native notification dispatch failed:', err);
        return false;
      }
    },
    []
  );

  return {
    isSupported,
    permission,
    isGranted: permission === 'granted',
    requestPermission,
    triggerLocalNotification,
  };
}
