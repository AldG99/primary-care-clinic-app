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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import PatientCard from '../../components/PatientCard';
import SearchBar from '../../components/SearchBar';

const PatientListScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { hasPermission, user } = useAuth();

  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadPatients();
    }
  }, [user]);

  useEffect(() => {
    filterPatients();
  }, [searchQuery, patients]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      console.log('Intentando cargar pacientes...');
      const patientsRef = collection(db, 'patients');

      const q = query(patientsRef, where('createdBy', '==', user.uid));

      const querySnapshot = await getDocs(q);

      console.log('Pacientes encontrados:', querySnapshot.docs.length);

      if (querySnapshot.empty) {
        console.log('No se encontraron pacientes en la base de datos');
        setPatients([]);
        setFilteredPatients([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const patientsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(
          'Paciente encontrado:',
          doc.id,
          data.firstName,
          data.lastName
        );
        return {
          id: doc.id,
          ...data,
        };
      });

      setPatients(patientsList);
      setFilteredPatients(patientsList);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      console.error('Detalle del error:', error.message, error.code);
      Alert.alert(
        'Error de carga',
        'No se pudieron cargar los pacientes: ' + error.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterPatients = () => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const searchTerms = searchQuery.toLowerCase().split(' ');

    const filtered = patients.filter(patient => {
      const fullName = `${patient.firstName.toLowerCase()} ${patient.lastName.toLowerCase()}`;
      const matchesAllTerms = searchTerms.every(
        term =>
          fullName.includes(term) ||
          patient.email?.toLowerCase().includes(term) ||
          patient.phone?.includes(term)
      );

      return matchesAllTerms;
    });

    setFilteredPatients(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPatients();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style="auto" />
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Pacientes</Text>
          {hasPermission('doctor') && (
            <TouchableOpacity
              style={[
                styles.addIconButton,
                { backgroundColor: colors.secondary },
              ]}
              onPress={() => navigation.navigate('AddPatient')}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        <SearchBar
          placeholder="Buscar pacientes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>
            Cargando pacientes...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <PatientCard patient={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Ionicons
                name="people-outline"
                size={24}
                color={colors.secondary}
              />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                {searchQuery
                  ? 'No se encontraron pacientes con esta búsqueda'
                  : 'No hay pacientes registrados aún'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

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
    flexDirection: 'row',
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
  },
});

export default PatientListScreen;
