import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { initDatabase, getLocalContacts, saveLocalContact, addLocalCallLog } from './src/db/db';
import { runBidirectionalSync, registerBackgroundSync } from './src/services/syncService'; // Wait backgroundSync is register
import { registerBackgroundSync as registerBgFetch } from './src/services/backgroundSync';
import { requestCallLogPermission } from './src/services/nativePermissions';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'Login' | 'Dashboard' | 'Contacts' | 'CallAssistant'>('Login');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Initialize DB and request permissions
  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        setDbReady(true);
        await requestCallLogPermission();
        await registerBgFetch();
      } catch (err) {
        console.error('Setup failed:', err);
      }
    }
    setup();
  }, []);

  // Fetch local contacts when switching to Contacts screen
  useEffect(() => {
    if (dbReady && currentScreen === 'Contacts') {
      loadContacts();
    }
  }, [currentScreen, dbReady]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await getLocalContacts();
      setContacts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (email.trim().length > 0) {
      // Mock login token creation
      setToken('mock-token-for-' + email);
      setCurrentScreen('Dashboard');
    }
  };

  const handleSync = async () => {
    if (!token) return;
    setSyncing(true);
    try {
      await runBidirectionalSync(token);
      if (currentScreen === 'Contacts') {
        await loadContacts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const addTestContact = async () => {
    const randomId = Math.random().toString(36).substring(7);
    const newContact = {
      id: randomId,
      fullName: 'New Contact ' + randomId.toUpperCase(),
      phone: '9845' + Math.floor(100000 + Math.random() * 900000),
      currentFolkStage: 'Fresh Lead',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveLocalContact(newContact, true); // Mark as dirty so it syncs to server
      await loadContacts();
    } catch (err) {
      console.error(err);
    }
  };

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3F51B5" />
        <Text style={styles.loadingText}>Initializing Offline Database...</Text>
      </View>
    );
  }

  // ==========================================
  // SCREEN: Login
  // ==========================================
  if (currentScreen === 'Login') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>FOLK CRM</Text>
        <Text style={styles.subtitle}>Spiritual Gems Native App</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="Enter Email Address"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==========================================
  // SCREEN: Dashboard / Nav wrapper
  // ==========================================
  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#3F51B5" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FOLK Spiritual Gems</Text>
        <TouchableOpacity style={styles.syncButton} onPress={handleSync} disabled={syncing}>
          <Text style={styles.syncText}>{syncing ? 'Syncing...' : 'Sync Now'}</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <View style={styles.body}>
        {currentScreen === 'Dashboard' && (
          <View style={styles.dashboardContainer}>
            <Text style={styles.welcome}>Welcome back, Enabler!</Text>
            
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>Local Sync Status</Text>
              <Text style={styles.cardInfo}>Database: SQLite Cache</Text>
              <Text style={styles.cardInfo}>Offline operations: Enabled</Text>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentScreen('Contacts')}>
              <Text style={styles.menuText}>👥 Contacts Module</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentScreen('CallAssistant')}>
              <Text style={styles.menuText}>📞 Calling Assistant</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentScreen === 'Contacts' && (
          <View style={styles.contactsContainer}>
            <View style={styles.row}>
              <Text style={styles.welcome}>CRM Contacts</Text>
              <TouchableOpacity style={styles.addButton} onPress={addTestContact}>
                <Text style={styles.addButtonText}>+ Add Contact</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#3F51B5" />
            ) : (
              <FlatList
                data={contacts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.contactItem}>
                    <Text style={styles.contactName}>{item.fullName}</Text>
                    <Text style={styles.contactPhone}>📞 {item.phone}</Text>
                    <Text style={styles.contactStage}>{item.currentFolkStage}</Text>
                    {item.is_dirty === 1 && (
                      <Text style={styles.dirtyLabel}>Pending Sync</Text>
                    )}
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.empty}>No cached contacts. Run sync to download database.</Text>
                }
              />
            )}
          </View>
        )}

        {currentScreen === 'CallAssistant' && (
          <View style={styles.callAssistantContainer}>
            <Text style={styles.welcome}>Calling Assistant</Text>
            <Text style={styles.subtitle}>Native system call tracking is active in the background.</Text>
            
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>Background Job Status</Text>
              <Text style={styles.cardInfo}>WorkManager Periodical Sync: Registered</Text>
              <Text style={styles.cardInfo}>Call Log Listener: Active</Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Tabs Navigation */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'Dashboard' && styles.activeTab]} 
          onPress={() => setCurrentScreen('Dashboard')}
        >
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'Contacts' && styles.activeTab]} 
          onPress={() => setCurrentScreen('Contacts')}
        >
          <Text style={styles.tabText}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'CallAssistant' && styles.activeTab]} 
          onPress={() => setCurrentScreen('CallAssistant')}
        >
          <Text style={styles.tabText}>Call Helper</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    height: 60,
    backgroundColor: '#3F51B5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  syncButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  syncText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
    padding: 15,
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  dashboardContainer: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3F51B5',
    marginBottom: 10,
  },
  cardInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  menuItem: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contactsContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  contactItem: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  contactStage: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
    marginTop: 4,
  },
  dirtyLabel: {
    fontSize: 10,
    color: '#F44336',
    fontWeight: 'bold',
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    color: '#999',
  },
  callAssistantContainer: {
    flex: 1,
  },
  tabs: {
    height: 60,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    borderTopWidth: 3,
    borderTopColor: '#3F51B5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
});
