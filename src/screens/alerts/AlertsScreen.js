import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  collection,
  query,
  getDocs,
  where,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useAlerts } from '../../hooks/useAlerts';
import AlertCard from '../../components/AlertCard';

const AlertsScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { hasPermission, user } = useAuth();
  const { alerts, loading: alertsContextLoading } = useAlerts();

  const [localAlerts, setLocalAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (user) {
      loadAlertsDirectly();
    }
  }, [user]);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      console.log('Alertas recibidas del contexto:', alerts.length);
      setLocalAlerts(alerts);
      setLoading(false);
    }
  }, [alerts]);

  const loadAlertsDirectly = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Intentando cargar alertas directamente...');
      const alertsRef = collection(db, 'alerts');

      const q = query(
        alertsRef,
        where('assignedTo', 'array-contains', user.uid)
      );

      const querySnapshot = await getDocs(q);
      console.log('Alertas encontradas:', querySnapshot.docs.length);

      if (querySnapshot.empty) {
        console.log('No se encontraron alertas');
        setLocalAlerts([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const alertsList = querySnapshot.docs.map(doc => {
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

      console.log('Alertas procesadas:', alertsList.length);

      alertsList.sort((a, b) => {
        const dateA = a.scheduledDate;
        const dateB = b.scheduledDate;
        return dateA - dateB;
      });

      setLocalAlerts(alertsList);
    } catch (error) {
      console.error('Error al cargar alertas directamente:', error);
      Alert.alert(
        'Error de carga',
        'No se pudieron cargar las alertas: ' + error.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getFilteredAlerts = () => {
    if (!localAlerts || localAlerts.length === 0) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (activeTab) {
      case 'pending':
        return localAlerts.filter(alert => !alert.completed);
      case 'today':
        return localAlerts.filter(alert => {
          const alertDate = new Date(alert.scheduledDate);
          return alertDate >= today && alertDate < tomorrow;
        });
      case 'upcoming':
        return localAlerts.filter(alert => {
          const alertDate = new Date(alert.scheduledDate);
          return alertDate >= tomorrow;
        });
      case 'completed':
        return localAlerts.filter(alert => alert.completed);
      default:
        return localAlerts;
    }
  };

  const markAsCompleted = async alertId => {
    try {
      const alertRef = doc(db, 'alerts', alertId);
      await updateDoc(alertRef, {
        completed: true,
        completedAt: new Date().toISOString(),
      });

      setLocalAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? {
                ...alert,
                completed: true,
                completedAt: new Date().toISOString(),
              }
            : alert
        )
      );
    } catch (error) {
      console.error('Error al marcar alerta como completada:', error);
      Alert.alert(
        'Error',
        'No se pudo marcar la alerta como completada: ' + error.message
      );
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAlertsDirectly();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style="auto" />

      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Alertas</Text>
          {hasPermission('doctor') && (
            <TouchableOpacity
              style={[
                styles.addIconButton,
                { backgroundColor: colors.secondary },
              ]}
              onPress={() => navigation.navigate('CreateAlert')}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollContainer}
          contentContainerStyle={styles.tabsContainer}
        >
          <ScrollableTab
            label="Pendientes"
            active={activeTab === 'pending'}
            onPress={() => setActiveTab('pending')}
            colors={colors}
          />
          <ScrollableTab
            label="Hoy"
            active={activeTab === 'today'}
            onPress={() => setActiveTab('today')}
            colors={colors}
          />
          <ScrollableTab
            label="Próximas"
            active={activeTab === 'upcoming'}
            onPress={() => setActiveTab('upcoming')}
            colors={colors}
          />
          <ScrollableTab
            label="Completadas"
            active={activeTab === 'completed'}
            onPress={() => setActiveTab('completed')}
            colors={colors}
          />
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>
            Cargando alertas...
          </Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredAlerts()}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              onComplete={
                !item.completed ? () => markAsCompleted(item.id) : null
              }
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={colors.secondary}
              />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                {activeTab === 'pending'
                  ? 'No hay alertas pendientes'
                  : activeTab === 'today'
                  ? 'No hay alertas para hoy'
                  : activeTab === 'upcoming'
                  ? 'No hay alertas programadas'
                  : 'No hay alertas completadas'}
              </Text>
              <Text
                style={[styles.emptyStateSubtext, { color: colors.subtext }]}
              >
                Total de alertas disponibles: {localAlerts.length}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const ScrollableTab = ({ label, active, onPress, colors }) => (
  <TouchableOpacity
    style={[
      styles.tab,
      active && {
        backgroundColor: colors.secondaryLight,
        borderColor: colors.secondary,
      },
      { borderColor: colors.border },
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.tabText,
        {
          color: active ? colors.secondary : colors.subtext,
          fontWeight: active ? '600' : '400',
        },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsScrollContainer: {
    flexGrow: 0,
  },
  tabsContainer: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  tabText: {
    fontSize: 12,
  },
  list: {
    padding: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  emptyState: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 16,
  },
  emptyStateText: {
    marginLeft: 8,
    fontSize: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 12,
  },
});

export default AlertsScreen;
