import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/auth-context';
import { Colors } from '../theme';

// Auth screens
import { LoginScreen } from '../screens/login-screen';
import { RegisterScreen } from '../screens/register-screen';
import { ForgotPasswordScreen } from '../screens/forgot-password-screen';
import { SetPasswordScreen } from '../screens/set-password-screen';

// Main screens
import { HomeScreen } from '../screens/home-screen';
import { ContactsScreen } from '../screens/contacts-screen';
import { ContactDetailScreen } from '../screens/contact-detail-screen';
import { ContactFormScreen } from '../screens/contact-form-screen';
import { GroupListScreen } from '../screens/group-list-screen';
import { GroupDetailScreen } from '../screens/group-detail-screen';
import { SessionListScreen } from '../screens/session-list-screen';
import { CallAssistantScreen } from '../screens/call-assistant-screen';
import { SessionSelectContactsScreen } from '../screens/session-select-contacts-screen';
import { CallingSessionScreen } from '../screens/calling-session-screen';
import { ProfileScreen } from '../screens/profile-screen';
import { SettingsScreen } from '../screens/settings-screen';
import { ChangePasswordScreen } from '../screens/change-password-screen';

// New screens
import { CheckInScreen } from '../screens/check-in-screen';
import { EventCheckInScreen } from '../screens/event-check-in-screen';
import { LiveActivityScreen } from '../screens/live-activity-screen';
import { LiveActivityDetailScreen } from '../screens/live-activity-detail-screen';
import { CoEnablerScreen } from '../screens/co-enabler-screen';
import { CoEnablerSessionScreen } from '../screens/co-enabler-session-screen';
import { NotificationCenterScreen } from '../screens/notification-center-screen';
import { BroadcastNotificationScreen } from '../screens/broadcast-notification-screen';
import { ReportScheduleScreen } from '../screens/report-schedule-screen';
import { UserManagementScreen } from '../screens/user-management-screen';
import { AuditLogScreen } from '../screens/audit-log-screen';
import { AssignmentsScreen } from '../screens/assignments-screen';
import { DownloadsScreen } from '../screens/downloads-screen';
import { TasksScreen } from '../screens/tasks-screen';

// Tab icon helper
function tabIcon(name: keyof typeof Ionicons.glyphMap, focused: boolean) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as any)}
      size={22}
      color={focused ? Colors.primary : Colors.textLight}
    />
  );
}

// ===================== Type Definitions =====================

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  SetPassword: { email: string; tempPassword?: string };
};

type ContactsStackParamList = {
  ContactsList: {
    scope?: string;
    contactSource?: string;
    callStatus?: string;
    event?: string;
    isSg?: string;
    chantingStatus?: string;
    folkStage?: string;
    enablerId?: string;
  } | undefined;
  ContactDetail: { personId: string };
  ContactForm: { personId?: string };
};

type GroupsStackParamList = {
  GroupList: undefined;
  GroupDetail: { groupId: string; groupName?: string };
};

type SessionsStackParamList = {
  SessionList: undefined;
  CallAssistant: undefined;
  SelectContacts: undefined;
  CallingSession: { sessionId: string };
};

type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  UserManagement: undefined;
  AuditLog: undefined;
};

type CheckinStackParamList = {
  CheckinList: undefined;
  EventCheckIn: { groupId: string; groupName: string };
};

type LiveActivityStackParamList = {
  LiveActivityList: undefined;
  LiveActivityDetail: { sessionId: string };
};

type CoEnablerStackParamList = {
  CoEnablerList: undefined;
  CoEnablerSession: { sessionId: string };
};

type NotificationsStackParamList = {
  NotificationCenter: undefined;
  BroadcastNotification: undefined;
};

type UtilityStackParamList = {
  Assignments: undefined;
  Downloads: undefined;
  Tasks: undefined;
  ReportSchedule: { groupId: string; groupName: string };
};

type MainTabParamList = {
  Home: undefined;
  ContactsTab: undefined;
  GroupsTab: undefined;
  SessionsTab: undefined;
  NotificationsTab: undefined;
  Profile: undefined;
};

// ===================== Stack Navigators =====================

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const ContactsStack = createNativeStackNavigator<ContactsStackParamList>();
const GroupsStack = createNativeStackNavigator<GroupsStackParamList>();
const SessionsStack = createNativeStackNavigator<SessionsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const CheckinStack = createNativeStackNavigator<CheckinStackParamList>();
const LiveActivityStack = createNativeStackNavigator<LiveActivityStackParamList>();
const CoEnablerStack = createNativeStackNavigator<CoEnablerStackParamList>();
const NotificationsStack = createNativeStackNavigator<NotificationsStackParamList>();
const UtilityStack = createNativeStackNavigator<UtilityStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: Colors.primary },
  headerTintColor: Colors.textOnPrimary,
  headerTitleStyle: { fontWeight: 'bold' as const },
};

// ===================== Navigators =====================

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={screenOptions}>
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: 'Reset Password' }}
      />
      <AuthStack.Screen
        name="SetPassword"
        component={SetPasswordScreen}
        options={{ title: 'Set Password' }}
      />
    </AuthStack.Navigator>
  );
}

function ContactsNavigator() {
  return (
    <ContactsStack.Navigator screenOptions={screenOptions}>
      <ContactsStack.Screen
        name="ContactsList"
        component={ContactsScreen}
        options={{ title: 'Contacts' }}
      />
      <ContactsStack.Screen
        name="ContactDetail"
        component={ContactDetailScreen}
        options={{ title: 'Contact' }}
      />
      <ContactsStack.Screen
        name="ContactForm"
        component={ContactFormScreen}
        options={({ route }: any) => ({
          title: route.params?.personId ? 'Edit Contact' : 'New Contact',
        })}
      />
    </ContactsStack.Navigator>
  );
}

function GroupsNavigator() {
  return (
    <GroupsStack.Navigator screenOptions={screenOptions}>
      <GroupsStack.Screen
        name="GroupList"
        component={GroupListScreen}
        options={{ title: 'Groups' }}
      />
      <GroupsStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={({ route }: any) => ({
          title: route.params?.groupName || 'Group',
        })}
      />
    </GroupsStack.Navigator>
  );
}

function SessionsNavigator() {
  return (
    <SessionsStack.Navigator screenOptions={screenOptions}>
      <SessionsStack.Screen
        name="SessionList"
        component={SessionListScreen}
        options={{ title: 'Sessions' }}
      />
      <SessionsStack.Screen
        name="CallAssistant"
        component={CallAssistantScreen}
        options={{ title: 'Call Assistant' }}
      />
      <SessionsStack.Screen
        name="SelectContacts"
        component={SessionSelectContactsScreen}
        options={{ title: 'Select Contacts' }}
      />
      <SessionsStack.Screen
        name="CallingSession"
        component={CallingSessionScreen}
        options={{ title: 'Calling', headerShown: false }}
      />
    </SessionsStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={screenOptions}>
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <ProfileStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <ProfileStack.Screen
        name="UserManagement"
        component={UserManagementScreen}
        options={{ title: 'User Management' }}
      />
      <ProfileStack.Screen
        name="AuditLog"
        component={AuditLogScreen}
        options={{ title: 'Audit Log' }}
      />
    </ProfileStack.Navigator>
  );
}

function CheckinNavigator() {
  return (
    <CheckinStack.Navigator screenOptions={screenOptions}>
      <CheckinStack.Screen
        name="CheckinList"
        component={CheckInScreen}
        options={{ title: 'Check-In' }}
      />
      <CheckinStack.Screen
        name="EventCheckIn"
        component={EventCheckInScreen}
        options={({ route }: any) => ({
          title: route.params?.groupName || 'Check-In',
        })}
      />
    </CheckinStack.Navigator>
  );
}

function LiveActivityNavigator() {
  return (
    <LiveActivityStack.Navigator screenOptions={screenOptions}>
      <LiveActivityStack.Screen
        name="LiveActivityList"
        component={LiveActivityScreen}
        options={{ title: 'Live Activity' }}
      />
      <LiveActivityStack.Screen
        name="LiveActivityDetail"
        component={LiveActivityDetailScreen}
        options={{ title: 'Session Detail' }}
      />
    </LiveActivityStack.Navigator>
  );
}

function CoEnablerNavigator() {
  return (
    <CoEnablerStack.Navigator screenOptions={screenOptions}>
      <CoEnablerStack.Screen
        name="CoEnablerList"
        component={CoEnablerScreen}
        options={{ title: 'Co-Enabler' }}
      />
      <CoEnablerStack.Screen
        name="CoEnablerSession"
        component={CoEnablerSessionScreen}
        options={{ title: 'Session' }}
      />
    </CoEnablerStack.Navigator>
  );
}

function NotificationsNavigator() {
  return (
    <NotificationsStack.Navigator screenOptions={screenOptions}>
      <NotificationsStack.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{ title: 'Notifications' }}
      />
      <NotificationsStack.Screen
        name="BroadcastNotification"
        component={BroadcastNotificationScreen}
        options={{ title: 'Broadcast' }}
      />
    </NotificationsStack.Navigator>
  );
}

function UtilityNavigator() {
  return (
    <UtilityStack.Navigator screenOptions={screenOptions}>
      <UtilityStack.Screen
        name="Assignments"
        component={AssignmentsScreen}
        options={{ title: 'Assignments' }}
      />
      <UtilityStack.Screen
        name="Downloads"
        component={DownloadsScreen}
        options={{ title: 'Downloads' }}
      />
      <UtilityStack.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ title: 'Tasks' }}
      />
      <UtilityStack.Screen
        name="ReportSchedule"
        component={ReportScheduleScreen}
        options={{ title: 'Report Schedule' }}
      />
    </UtilityStack.Navigator>
  );
}

// ===================== Main Tab =====================

function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.textOnPrimary,
        headerTitleStyle: { fontWeight: 'bold' as const },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          borderTopColor: Colors.border,
          backgroundColor: Colors.surface,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: 'bold' as const },
      }}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: 'FOLK Spiritual Gems',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => tabIcon('home', focused),
        }}
      />
      <MainTab.Screen
        name="ContactsTab"
        component={ContactsNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Contacts',
          tabBarIcon: ({ focused }) => tabIcon('people', focused),
        }}
      />
      <MainTab.Screen
        name="GroupsTab"
        component={GroupsNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Groups',
          tabBarIcon: ({ focused }) => tabIcon('folder', focused),
        }}
      />
      <MainTab.Screen
        name="SessionsTab"
        component={SessionsNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Sessions',
          tabBarIcon: ({ focused }) => tabIcon('call', focused),
        }}
      />
      <MainTab.Screen
        name="NotificationsTab"
        component={NotificationsNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ focused }) => tabIcon('notifications', focused),
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => tabIcon('person', focused),
        }}
      />
    </MainTab.Navigator>
  );
}

// ===================== App Navigator =====================

export function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
