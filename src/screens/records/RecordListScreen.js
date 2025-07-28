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
import RecordCard from '../../components/RecordCard';
import SearchBar from '../../components/SearchBar';

const RecordListScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { hasPermission, user } = useAuth();

  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadRecords();
    }
  }, [user]);

  useEffect(() => {
    filterRecords();
  }, [searchQuery, records]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      console.log('Intentando cargar registros...');
      const recordsRef = collection(db, 'records');

      const q = query(recordsRef, where('createdBy', '==', user.uid));

      const querySnapshot = await getDocs(q);
      console.log('Registros encontrados:', querySnapshot.docs.length);

      if (querySnapshot.empty) {
        console.log('No se encontraron registros en la base de datos');
        setRecords([]);
        setFilteredRecords([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const recordsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      recordsList.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      });

      setRecords(recordsList);
      setFilteredRecords(recordsList);
    } catch (error) {
      console.error('Error al cargar registros:', error);
      console.error('Detalle del error:', error.message, error.code);
      Alert.alert(
        'Error de carga',
        'No se pudieron cargar los registros: ' + error.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterRecords = () => {
    if (!searchQuery.trim()) {
      setFilteredRecords(records);
      return;
    }

    const searchTerms = searchQuery.toLowerCase().split(' ');

    const filtered = records.filter(record => {
      const title = (record.title || '').toLowerCase();
      const patientName = (record.patientName || '').toLowerCase();
      const diagnosis = (record.diagnosis || '').toLowerCase();
      const searchableText = `${title} ${patientName} ${diagnosis}`;
      return searchTerms.every(term => searchableText.includes(term));
    });

    setFilteredRecords(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecords();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style="auto" />
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Registros médicos
          </Text>
          {hasPermission('doctor') && (
            <TouchableOpacity
              style={[
                styles.addIconButton,
                { backgroundColor: colors.secondary },
              ]}
              onPress={() => navigation.navigate('AddRecord')}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        <SearchBar
          placeholder="Buscar registros..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          showFilter={true}
          filters={{}}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>
            Cargando registros...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <RecordCard record={item} showPatientInfo />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={colors.secondary}
              />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                {searchQuery
                  ? 'No se encontraron registros con esta búsqueda'
                  : 'No hay registros médicos aún'}
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

export default RecordListScreen;
