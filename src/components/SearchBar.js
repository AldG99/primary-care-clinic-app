import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import Button from './Button';

const SearchBar = ({
  placeholder = 'Buscar...',
  value,
  onChangeText,
  onSearch,
  onClear,
  onFilter,
  showFilter = false,
  filters = {},
  style,
}) => {
  const { colors } = useTheme();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    if (onFilter) {
      onFilter(tempFilters);
    }
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    const emptyFilters = Object.keys(tempFilters).reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {});

    setTempFilters(emptyFilters);

    if (onFilter) {
      onFilter(emptyFilters);
    }

    setFilterModalVisible(false);
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== null && value !== '');
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.subtext}
          style={styles.searchIcon}
        />

        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.subtext}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          onSubmitEditing={onSearch}
          clearButtonMode="while-editing"
        />

        {value !== '' && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.subtext} />
          </TouchableOpacity>
        )}

        {showFilter && (
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={[
              styles.filterButton,
              hasActiveFilters() && {
                backgroundColor: colors.secondaryLight,
              },
            ]}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={hasActiveFilters() ? colors.secondary : colors.subtext}
            />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filtros de búsqueda
              </Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filtersContainer}>
              <View style={styles.filterSection}>
                <Text
                  style={[styles.filterSectionTitle, { color: colors.text }]}
                >
                  Tipo de registro
                </Text>
                <View style={styles.filterOptions}>
                  {[
                    'Consulta',
                    'Laboratorio',
                    'Prescripción',
                    'Signos vitales',
                    'Procedimiento',
                  ].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterChip,
                        tempFilters.type === type.toLowerCase() && {
                          backgroundColor: colors.secondaryLight,
                          borderColor: colors.secondary,
                        },
                      ]}
                      onPress={() =>
                        handleFilterChange(
                          'type',
                          tempFilters.type === type.toLowerCase()
                            ? null
                            : type.toLowerCase()
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color:
                              tempFilters.type === type.toLowerCase()
                                ? colors.secondary
                                : colors.text,
                          },
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text
                  style={[styles.filterSectionTitle, { color: colors.text }]}
                >
                  Rango de fechas
                </Text>
                <View style={styles.filterOptions}>
                  {['Hoy', 'Esta semana', 'Este mes', 'Este año'].map(date => (
                    <TouchableOpacity
                      key={date}
                      style={[
                        styles.filterChip,
                        tempFilters.dateRange === date.toLowerCase() && {
                          backgroundColor: colors.secondaryLight,
                          borderColor: colors.secondary,
                        },
                      ]}
                      onPress={() =>
                        handleFilterChange(
                          'dateRange',
                          tempFilters.dateRange === date.toLowerCase()
                            ? null
                            : date.toLowerCase()
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color:
                              tempFilters.dateRange === date.toLowerCase()
                                ? colors.secondary
                                : colors.text,
                          },
                        ]}
                      >
                        {date}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text
                  style={[styles.filterSectionTitle, { color: colors.text }]}
                >
                  Diagnóstico
                </Text>
                <TextInput
                  style={[
                    styles.filterInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Buscar por diagnóstico"
                  placeholderTextColor={colors.subtext}
                  value={tempFilters.diagnosis || ''}
                  onChangeText={text => handleFilterChange('diagnosis', text)}
                />
              </View>
            </ScrollView>

            <View
              style={[styles.modalFooter, { borderTopColor: colors.border }]}
            >
              <Button
                title="Limpiar filtros"
                onPress={clearFilters}
                variant="secondary"
                size="medium"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Aplicar filtros"
                onPress={applyFilters}
                variant="primary"
                size="medium"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  clearButton: {
    padding: 6,
  },
  filterButton: {
    padding: 6,
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingHorizontal: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    fontSize: 14,
  },
  filterInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    paddingBottom: 32,
  },
});

export default SearchBar;
