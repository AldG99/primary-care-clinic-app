// src/screens/profile/ProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { colors, theme, toggleTheme } = useTheme();
  const { user, userRole, logout } = useAuth();

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await logout();
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Alert.alert('Error', 'Ha ocurrido un error al cerrar sesión');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const renderSettingItem = ({
    icon,
    title,
    value,
    onPress,
    type = 'arrow',
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.settingItemLeft}>
        <Ionicons
          name={icon}
          size={22}
          color={colors.secondary}
          style={styles.settingIcon}
        />
        <Text style={[styles.settingTitle, { color: colors.text }]}>
          {title}
        </Text>
      </View>

      {type === 'arrow' && (
        <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
      )}

      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onPress}
          trackColor={{ false: colors.border, true: colors.secondaryLight }}
          thumbColor={value ? colors.secondary : '#f4f3f4'}
        />
      )}

      {type === 'text' && (
        <Text style={[styles.settingValue, { color: colors.subtext }]}>
          {value}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style="auto" />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Mi perfil</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: colors.secondaryLight },
            ]}
          >
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.avatarText, { color: colors.secondary }]}>
                {user?.displayName?.charAt(0) || 'U'}
              </Text>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.displayName || 'Usuario'}
            </Text>

            <Text style={[styles.profileEmail, { color: colors.subtext }]}>
              {user?.email || ''}
            </Text>

            {user?.organization && (
              <Text
                style={[styles.profileOrganization, { color: colors.subtext }]}
              >
                {user.organization}
              </Text>
            )}

            <View
              style={[
                styles.roleBadge,
                { backgroundColor: colors.secondaryLight },
              ]}
            >
              <Text style={[styles.roleText, { color: colors.secondary }]}>
                {userRole === 'doctor' ? 'Médico' : 'Enfermera/o'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Cuenta
          </Text>

          {renderSettingItem({
            icon: 'person-outline',
            title: 'Editar perfil',
            onPress: () => {
              navigation.navigate('EditProfile');
            },
          })}

          {renderSettingItem({
            icon: 'lock-closed-outline',
            title: 'Cambiar contraseña',
            onPress: () => {},
          })}

          {renderSettingItem({
            icon: 'notifications-outline',
            title: 'Notificaciones',
            onPress: () => {},
          })}
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Apariencia
          </Text>

          {renderSettingItem({
            icon: 'moon-outline',
            title: 'Tema oscuro',
            value: theme === 'dark',
            onPress: toggleTheme,
            type: 'switch',
          })}
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Información
          </Text>

          {renderSettingItem({
            icon: 'information-circle-outline',
            title: 'Versión',
            value: '1.0.0',
            type: 'text',
          })}

          {renderSettingItem({
            icon: 'help-circle-outline',
            title: 'Ayuda y soporte',
            onPress: () => {},
          })}

          {renderSettingItem({
            icon: 'document-text-outline',
            title: 'Términos y condiciones',
            onPress: () => {},
          })}

          {renderSettingItem({
            icon: 'shield-outline',
            title: 'Política de privacidad',
            onPress: () => {},
          })}
        </View>

        <Button
          title="Cerrar sesión"
          onPress={handleLogout}
          loading={loading}
          variant="danger"
          style={styles.logoutButton}
          leftIcon={<Ionicons name="log-out-outline" size={20} color="#FFF" />}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  profileOrganization: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  setting: {
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 16,
  },
});

export default ProfileScreen;
