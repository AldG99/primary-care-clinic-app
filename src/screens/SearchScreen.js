import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import SearchBar from '../components/SearchBar';
import PatientCard from '../components/PatientCard';
import RecordCard from '../components/RecordCard';

const SearchScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('patients');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: null,
    dateRange: null,
    diagnosis: null,
  });

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      handleSearch();
    }
  }, [filters, searchMode]);

  const handleSearch = async () => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      if (searchMode === 'patients') {
        await searchPatients();
      } else {
        await searchRecords();
      }
    } catch (error) {
      console.error('Error al buscar:', error);
      Alert.alert(
        'Error',
        'Ocurrió un error al realizar la búsqueda: ' + error.message
      );
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async () => {
    try {
      console.log('Buscando pacientes con query:', searchQuery);
      const patientsRef = collection(db, 'patients');

      const q = query(patientsRef, where('createdBy', '==', user.uid));

      const querySnapshot = await getDocs(q);
      console.log('Total de pacientes encontrados:', querySnapshot.docs.length);

      if (querySnapshot.empty) {
        console.log('No hay pacientes en la base de datos');
        setSearchResults([]);
        return;
      }

      const allPatients = querySnapshot.docs.map(doc => {
        try {
          const data = doc.data();
          if (!data.firstName || !data.lastName) {
            console.warn(`Paciente ${doc.id} con datos incompletos:`, data);
          }
          return {
            id: doc.id,
            ...data,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            birthDate: data.birthDate || null,
            gender: data.gender || 'unknown',
            phone: data.phone || '',
          };
        } catch (error) {
          console.error(`Error al procesar paciente ${doc.id}:`, error);
          return {
            id: doc.id,
            firstName: 'Error',
            lastName: 'de datos',
            birthDate: null,
            gender: 'unknown',
            phone: '',
          };
        }
      });

      if (searchQuery.trim() === '') {
        setSearchResults(allPatients);
        return;
      }

      const searchTermLower = searchQuery.toLowerCase();
      const filtered = allPatients.filter(patient => {
        const firstName = (patient.firstName || '').toLowerCase();
        const lastName = (patient.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`;
        const email = (patient.email || '').toLowerCase();
        const phone = (patient.phone || '').toLowerCase();
        return (
          fullName.includes(searchTermLower) ||
          email.includes(searchTermLower) ||
          phone.includes(searchTermLower)
        );
      });

      console.log('Pacientes filtrados:', filtered.length);
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error en searchPatients:', error);
      throw error;
    }
  };

  const searchRecords = async () => {
    try {
      console.log('Buscando registros con query:', searchQuery);
      const recordsRef = collection(db, 'records');

      const q = query(recordsRef, where('createdBy', '==', user.uid));

      const querySnapshot = await getDocs(q);
      console.log('Total de registros encontrados:', querySnapshot.docs.length);

      if (querySnapshot.empty) {
        console.log('No hay registros en la base de datos');
        setSearchResults([]);
        return;
      }

      const allRecords = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      let filtered = allRecords;

      if (filters.type) {
        filtered = filtered.filter(record => record.type === filters.type);
      }

      if (filters.diagnosis) {
        filtered = filtered.filter(
          record =>
            record.diagnosis &&
            record.diagnosis
              .toLowerCase()
              .includes(filters.diagnosis.toLowerCase())
        );
      }

      if (filters.dateRange) {
      }

      if (searchQuery.trim() !== '') {
        const searchTermLower = searchQuery.toLowerCase();
        filtered = filtered.filter(record => {
          const title = (record.title || '').toLowerCase();
          const summary = (record.summary || '').toLowerCase();
          const diagnosis = (record.diagnosis || '').toLowerCase();
          const patientName = (record.patientName || '').toLowerCase();
          return (
            title.includes(searchTermLower) ||
            summary.includes(searchTermLower) ||
            diagnosis.includes(searchTermLower) ||
            patientName.includes(searchTermLower)
          );
        });
      }

      console.log('Registros filtrados:', filtered.length);
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error en searchRecords:', error);
      throw error;
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Búsqueda avanzada
        </Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              searchMode === 'patients' && [
                styles.activeTab,
                {
                  backgroundColor: colors.secondaryLight,
                  borderColor: colors.secondary,
                },
              ],
              { borderColor: colors.border },
            ]}
            onPress={() => setSearchMode('patients')}
          >
            <Ionicons
              name="people"
              size={18}
              color={
                searchMode === 'patients' ? colors.secondary : colors.subtext
              }
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    searchMode === 'patients'
                      ? colors.secondary
                      : colors.subtext,
                  fontWeight: searchMode === 'patients' ? '600' : '400',
                },
              ]}
            >
              Pacientes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              searchMode === 'records' && [
                styles.activeTab,
                {
                  backgroundColor: colors.secondaryLight,
                  borderColor: colors.secondary,
                },
              ],
              { borderColor: colors.border },
            ]}
            onPress={() => setSearchMode('records')}
          >
            <Ionicons
              name="document-text"
              size={18}
              color={
                searchMode === 'records' ? colors.secondary : colors.subtext
              }
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    searchMode === 'records'
                      ? colors.secondary
                      : colors.subtext,
                  fontWeight: searchMode === 'records' ? '600' : '400',
                },
              ]}
            >
              Registros
            </Text>
          </TouchableOpacity>
        </View>
        <SearchBar
          placeholder={
            searchMode === 'patients'
              ? 'Buscar pacientes...'
              : 'Buscar registros...'
          }
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSearch={handleSearch}
          onClear={handleClear}
          showFilter={searchMode === 'records'}
          filters={filters}
          onFilter={setFilters}
        />
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>
            Buscando...
          </Text>
        </View>
      ) : (
        <>
          {searchQuery.trim().length > 0 && (
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsCount, { color: colors.text }]}>
                {searchResults.length} resultado
                {searchResults.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          <FlatList
            data={searchResults}
            keyExtractor={item => item.id}
            renderItem={({ item }) =>
              searchMode === 'patients' ? (
                <PatientCard patient={item} />
              ) : (
                <RecordCard record={item} showPatientInfo />
              )
            }
            contentContainerStyle={styles.resultsList}
            ListEmptyComponent={
              searchQuery.trim().length > 0 ? (
                <View
                  style={[styles.emptyState, { borderColor: colors.border }]}
                >
                  <Ionicons
                    name="search-outline"
                    size={24}
                    color={colors.secondary}
                  />
                  <Text style={[styles.emptyStateText, { color: colors.text }]}>
                    No se encontraron resultados
                  </Text>
                </View>
              ) : (
                <View style={styles.initialState}>
                  <Ionicons
                    name="search"
                    size={48}
                    color={colors.secondary}
                    style={styles.initialIcon}
                  />
                  <Text style={[styles.initialText, { color: colors.text }]}>
                    Busca{' '}
                    {searchMode === 'patients'
                      ? 'pacientes'
                      : 'registros médicos'}
                  </Text>
                  <Text
                    style={[styles.initialSubtext, { color: colors.subtext }]}
                  >
                    Ingresa un término de búsqueda para comenzar
                  </Text>
                  {searchMode === 'records' && (
                    <Text
                      style={[styles.initialSubtext, { color: colors.subtext }]}
                    >
                      Usa los filtros para una búsqueda más precisa
                    </Text>
                  )}
                </View>
              )
            }
          />
        </>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  activeTab: {
    borderWidth: 1,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 14,
  },
  resultsList: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
    paddingBottom: 16,
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
  initialState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 80,
  },
  initialIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  initialText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  initialSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default SearchScreen;
