import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useAlerts } from '../hooks/useAlerts';
import PatientCard from '../components/PatientCard';
import RecordCard from '../components/RecordCard';
import AlertCard from '../components/AlertCard';
import Button from '../components/Button';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user, userRole } = useAuth();
  const { alerts } = useAlerts();
  const [recentPatients, setRecentPatients] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [todayAlerts, setTodayAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (alerts) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filtered = alerts
        .filter(alert => {
          const alertDate = new Date(alert.scheduledDate);
          alertDate.setHours(0, 0, 0, 0);
          return alertDate.getTime() === today.getTime();
        })
        .slice(0, 3);
      setTodayAlerts(filtered);
    }
  }, [alerts]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const patientsQuery = query(
        collection(db, 'patients'),
        where('createdBy', '==', user.uid),
        orderBy('lastUpdated', 'desc'),
        limit(3)
      );
      const patientsSnapshot = await getDocs(patientsQuery);
      const patientsData = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentPatients(patientsData);

      const recordsQuery = query(
        collection(db, 'records'),
        where('createdBy', '==', user.uid),
        orderBy('date', 'desc'),
        limit(3)
      );
      const recordsSnapshot = await getDocs(recordsQuery);
      const recordsData = recordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentRecords(recordsData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    let greeting = '';
    if (hour < 12) {
      greeting = 'Buenos días';
    } else if (hour < 18) {
      greeting = 'Buenas tardes';
    } else {
      greeting = 'Buenas noches';
    }
    return greeting;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {getGreeting()},
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.displayName || 'Usuario'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.profileButton,
            { backgroundColor: colors.secondaryLight },
          ]}
          onPress={() => navigation.navigate('Perfil')}
        >
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={20} color={colors.secondary} />
          )}
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Alertas de hoy
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Alertas')}>
              <Text style={[styles.sectionLink, { color: colors.secondary }]}>
                Ver todo
              </Text>
            </TouchableOpacity>
          </View>
          {todayAlerts.length > 0 ? (
            todayAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
          ) : (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color={colors.success}
              />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                No hay alertas pendientes para hoy
              </Text>
            </View>
          )}
          <Button
            title="Crear recordatorio"
            onPress={() =>
              navigation.navigate('Alertas', { screen: 'CreateAlert' })
            }
            variant="secondary"
            size="small"
            fullWidth
            leftIcon={
              <Ionicons
                name="add-circle-outline"
                size={16}
                color={colors.secondary}
              />
            }
            style={styles.actionButton}
          />
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Pacientes recientes
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Pacientes')}>
              <Text style={[styles.sectionLink, { color: colors.secondary }]}>
                Ver todo
              </Text>
            </TouchableOpacity>
          </View>
          {recentPatients.length > 0 ? (
            recentPatients.map(patient => (
              <PatientCard key={patient.id} patient={patient} />
            ))
          ) : (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Ionicons
                name="people-outline"
                size={24}
                color={colors.secondary}
              />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                No hay pacientes registrados aún
              </Text>
            </View>
          )}
          <Button
            title="Registrar paciente"
            onPress={() =>
              navigation.navigate('Pacientes', { screen: 'AddPatient' })
            }
            variant="secondary"
            size="small"
            fullWidth
            leftIcon={
              <Ionicons
                name="add-circle-outline"
                size={16}
                color={colors.secondary}
              />
            }
            style={styles.actionButton}
          />
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Últimos registros
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Registros')}>
              <Text style={[styles.sectionLink, { color: colors.secondary }]}>
                Ver todo
              </Text>
            </TouchableOpacity>
          </View>
          {recentRecords.length > 0 ? (
            recentRecords.map(record => (
              <RecordCard key={record.id} record={record} showPatientInfo />
            ))
          ) : (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={colors.secondary}
              />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                No hay registros médicos aún
              </Text>
            </View>
          )}
          <Button
            title="Nuevo registro"
            onPress={() =>
              navigation.navigate('Registros', { screen: 'AddRecord' })
            }
            variant="secondary"
            size="small"
            fullWidth
            leftIcon={
              <Ionicons
                name="add-circle-outline"
                size={16}
                color={colors.secondary}
              />
            }
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionLink: {
    fontSize: 14,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  emptyStateText: {
    marginLeft: 8,
    fontSize: 14,
  },
  actionButton: {
    marginTop: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
});

export default HomeScreen;
