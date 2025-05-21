import React, { createContext, useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../hooks/useAuth';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    configurePushNotifications();
  }, []);

  const configurePushNotifications = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('No se obtuvieron permisos para enviar notificaciones');
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  };

  useEffect(() => {
    if (!user) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const loadAlerts = async () => {
      try {
        console.log(
          '[AlertContext] Intentando cargar alertas para usuario:',
          user.uid
        );
        const now = new Date();
        const startOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        const alertsRef = collection(db, 'alerts');
        const q = query(
          alertsRef,
          where('assignedTo', 'array-contains', user.uid)
        );

        const snapshot = await getDocs(q);
        console.log(
          '[AlertContext] Alertas encontradas:',
          snapshot.docs.length
        );

        if (snapshot.empty) {
          console.log('[AlertContext] No se encontraron alertas');
          setAlerts([]);
          setLoading(false);
          return;
        }

        const alertsList = snapshot.docs.map(doc => {
          const data = doc.data();
          const scheduledDate =
            data.scheduledDate instanceof Timestamp
              ? data.scheduledDate.toDate()
              : new Date(data.scheduledDate);

          return {
            id: doc.id,
            ...data,
            scheduledDate,
          };
        });

        alertsList.sort((a, b) => {
          const dateA = a.scheduledDate;
          const dateB = b.scheduledDate;
          return dateA - dateB;
        });

        setAlerts(alertsList);

        if (notificationsEnabled) {
          scheduleNotifications(alertsList);
        }
      } catch (error) {
        console.error('[AlertContext] Error al cargar alertas:', error);
        console.error('[AlertContext] Detalle:', error.message, error.code);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();

    const alertsQuery = query(
      collection(db, 'alerts'),
      where('assignedTo', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(
      alertsQuery,
      snapshot => {
        const alertsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          scheduledDate:
            doc.data().scheduledDate instanceof Timestamp
              ? doc.data().scheduledDate.toDate()
              : new Date(doc.data().scheduledDate),
        }));

        setAlerts(alertsList);

        if (notificationsEnabled) {
          scheduleNotifications(alertsList);
        }
      },
      error => {
        console.error('Error en tiempo real de alertas:', error);
      }
    );

    return () => unsubscribe();
  }, [user, notificationsEnabled]);

  const scheduleNotifications = async alertsList => {
    console.log(
      '[AlertContext] Programando notificaciones para',
      alertsList.length,
      'alertas'
    );

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const futureAlerts = alertsList.filter(
        alert => alert.scheduledDate > new Date() && !alert.completed
      );

      console.log(
        '[AlertContext] Programando',
        futureAlerts.length,
        'notificaciones futuras'
      );

      for (const alert of futureAlerts.slice(0, 5)) {
        if (alert.scheduledDate > new Date()) {
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: alert.title,
                body: alert.description || 'Tienes una alerta pendiente',
                data: { alertId: alert.id },
              },
              trigger: {
                date: alert.scheduledDate,
              },
            });
            console.log(
              '[AlertContext] Notificación programada para',
              alert.title,
              'el',
              alert.scheduledDate
            );
          } catch (innerError) {
            console.error(
              '[AlertContext] Error al programar notificación:',
              innerError
            );
          }
        }
      }
    } catch (error) {
      console.error(
        '[AlertContext] Error general al programar notificaciones:',
        error
      );
    }
  };

  const refreshAlerts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const alertsRef = collection(db, 'alerts');
      const q = query(
        alertsRef,
        where('assignedTo', 'array-contains', user.uid)
      );

      const snapshot = await getDocs(q);

      const alertsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledDate:
          doc.data().scheduledDate instanceof Timestamp
            ? doc.data().scheduledDate.toDate()
            : new Date(doc.data().scheduledDate),
      }));

      setAlerts(alertsList);

      if (notificationsEnabled) {
        scheduleNotifications(alertsList);
      }
    } catch (error) {
      console.error('[AlertContext] Error al refrescar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const disableNotifications = () => {
    console.log('[AlertContext] Deshabilitando notificaciones');
    setNotificationsEnabled(false);
    Notifications.cancelAllScheduledNotificationsAsync().catch(error =>
      console.error('Error al cancelar notificaciones:', error)
    );
  };

  const enableNotifications = () => {
    console.log('[AlertContext] Habilitando notificaciones');
    setNotificationsEnabled(true);
    scheduleNotifications(alerts);
  };

  const value = {
    alerts,
    loading,
    refreshAlerts,
    disableNotifications,
    enableNotifications,
  };

  return (
    <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
  );
};
