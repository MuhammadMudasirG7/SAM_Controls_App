import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { translations, getGlobalLang, subscribeLang } from './i18n';

import LoginScreen from './src/components/Screens/LoginScreen';
import ForgotPasswordScreen from './src/components/Screens/ForgotPasswordScreen';
import OtpVerificationScreen from './src/components/Screens/OtpVerificationScreen';
import CreateNewPasswordScreen from './src/components/Screens/CreateNewPasswordScreen';
import ServerSettingsScreen from './src/components/Screens/ServerSettingsScreen';
import BiometricSetupScreen from './src/components/Screens/BiometricSetupScreen';
import DashboardScreen from './src/components/Screens/DashboardScreen';
import CheckInScreen from './src/components/Screens/CheckInScreen';
import CheckOutScreen from './src/components/Screens/CheckOutScreen';
import HourlyPresenceScreen from './src/components/Screens/HourlyPresenceScreen';
import AttendanceScreen from './src/components/Screens/AttendanceScreen';
import LeaveRequestScreen from './src/components/Screens/LeaveRequestScreen';
import MyLeaveRequestsScreen from './src/components/Screens/MyLeaveRequestsScreen';
import ProfileScreen from './src/components/Screens/ProfileScreen';
import ChangePasswordScreen from './src/components/Screens/ChangePasswordScreen';
import LocationPrivacyScreen from './src/components/Screens/LocationPrivacyScreen';

// 🛠️ Admin Dashboard Screen Import
import AdminDashboardScreen from './src/components/Screens/AdminDashboardScreen';

export default function App() {
  const [currentLang, setCurrentLang] = useState(getGlobalLang());
  const [currentScreen, setCurrentScreen] = useState('login');
  const [loginState, setLoginState] = useState('default');
  const [serverAddress, setServerAddress] = useState('http://192.168.100.199:8081');
  const [biometricTargetType, setBiometricTargetType] = useState('fingerprint');
  const [savedEmployeeId, setSavedEmployeeId] = useState('EMP-10482');
  const [globalUserData, setGlobalUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeLang((newLang) => {
      setCurrentLang(newLang);
    });
    return () => unsubscribe();
  }, []);

  const t = translations[currentLang];
  const isRtl = currentLang === 'ur' || currentLang === 'ar';

  const handleLoginSuccess = async (userPayload) => {
    try {
      if (userPayload) {
        setGlobalUserData(userPayload);
        if (userPayload.employeeId) {
          setSavedEmployeeId(userPayload.employeeId);
        }
      } else {
        setGlobalUserData({
          employeeId: "EMP-10482",
          name: "Muhammad Ali",
          email: "f.ali@najd-infra.sa",
          role: "employee"
        });
      }

      if (userPayload?.role === 'admin' || userPayload?.employeeId === 'ADMIN-01') {
        setCurrentScreen('admin_dashboard');
        return;
      }

      const bioStatus = await SecureStore.getItemAsync('biometric_enabled_status');
      if (bioStatus === 'true') {
        setCurrentScreen('dashboard');
      } else {
        setCurrentScreen('biometric_setup');
      }
    } catch (err) {
      setCurrentScreen('biometric_setup');
    }
  };

  const handleBiometricDone = () => {
    setCurrentScreen('dashboard');
  };

  const isRestrictedScreen = 
    currentScreen !== 'dashboard' && 
    currentScreen !== 'admin_dashboard' && 
    currentScreen !== 'biometric_setup' && 
    currentScreen !== 'check_in' && 
    currentScreen !== 'check_out' && 
    currentScreen !== 'hourly_presence' && 
    currentScreen !== 'attendance' && 
    currentScreen !== 'leave_request' && 
    currentScreen !== 'my_leave_requests' && 
    currentScreen !== 'profile' && 
    currentScreen !== 'change_password' && 
    currentScreen !== 'location_privacy';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { direction: isRtl ? 'rtl' : 'ltr' }]}>
        {isRestrictedScreen && (
          <View style={styles.topBanner}>
            <Text style={styles.topBannerText}>
              {currentLang === 'ur' ? '⚠️ غیر محفوظ — صرف ٹیسٹ اکاؤنٹس' : currentLang === 'ar' ? '⚠️ غير آمن — حسابات الاختبار فقط' : '⚠️ Not secure — test accounts only'}
            </Text>
          </View>
        )}

        {currentScreen === 'login' && (
          <LoginScreen
            loginState={loginState}
            setLoginErrorState={setLoginState}
            serverAddress={serverAddress}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToForgot={() => setCurrentScreen('forgot_password')}
            onNavigateToSettings={() => setCurrentScreen('server_settings')}
          />
        )}

        {currentScreen === 'forgot_password' && (
          <ForgotPasswordScreen
            serverAddress={serverAddress}
            onBackToLogin={() => setCurrentScreen('login')}
            onNavigateToOtp={(empId) => {
              setSavedEmployeeId(empId);
              setCurrentScreen('otp_verify');
            }}
          />
        )}

        {currentScreen === 'otp_verify' && (
          <OtpVerificationScreen
            serverAddress={serverAddress}
            employeeId={savedEmployeeId}
            onBackToForgot={() => setCurrentScreen('forgot_password')}
            onVerificationSuccess={() => setCurrentScreen('create_new_password')}
          />
        )}

        {currentScreen === 'create_new_password' && (
          <CreateNewPasswordScreen
            onBackToOtp={() => setCurrentScreen('otp_verify')}
            onResetSuccess={() => setCurrentScreen('login')}
          />
        )}

        {currentScreen === 'server_settings' && (
          <ServerSettingsScreen
            currentServer={serverAddress}
            onSaveServer={(newUrl) => {
              setServerAddress(newUrl);
              if (newUrl.includes('.local')) {
                setBiometricTargetType('face_id');
              } else {
                setBiometricTargetType('fingerprint');
              }
            }}
            onBackToLogin={() => setCurrentScreen('login')}
          />
        )}

        {currentScreen === 'biometric_setup' && (
          <BiometricSetupScreen
            biometricType={biometricTargetType}
            employeeId={savedEmployeeId}
            onTurnOn={handleBiometricDone}
            onNotNow={handleBiometricDone}
          />
        )}

        {currentScreen === 'admin_dashboard' && (
          <AdminDashboardScreen
            onLogout={() => setCurrentScreen('login')}
            serverAddress={serverAddress}
          />
        )}

        {currentScreen === 'dashboard' && (
          <DashboardScreen
            userProfileData={globalUserData}
            serverAddress={serverAddress}
            onNavigateToCheckIn={() => setCurrentScreen('check_in')}
            onNavigateToCheckOut={() => setCurrentScreen('check_out')}
            onNavigateToHourly={() => setCurrentScreen('hourly_presence')}
            onNavigateToAttendance={() => setCurrentScreen('attendance')}
            onNavigateToLeave={() => setCurrentScreen('leave_request')}
            onNavigateToMyLeaveRequests={() => setCurrentScreen('my_leave_requests')}
            onNavigateToProfile={() => setCurrentScreen('profile')}
            onNavigateHome={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'check_in' && (
          <CheckInScreen
            employeeId={savedEmployeeId}
            serverAddress={serverAddress}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'check_out' && (
          <CheckOutScreen
            employeeId={savedEmployeeId}
            serverAddress={serverAddress}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'hourly_presence' && (
          <HourlyPresenceScreen 
            employeeId={savedEmployeeId} 
            serverAddress={serverAddress}
            onBack={() => setCurrentScreen('dashboard')} 
          />
        )}

        {currentScreen === 'attendance' && (
          <AttendanceScreen 
            onBack={() => setCurrentScreen('dashboard')}
            onNavigateHome={() => setCurrentScreen('dashboard')}
            onNavigateToAttendance={() => setCurrentScreen('attendance')}
            onNavigateToLeave={() => setCurrentScreen('leave_request')}
            onNavigateToProfile={() => setCurrentScreen('profile')}
          />
        )}

        {currentScreen === 'leave_request' && (
          <LeaveRequestScreen 
            onBack={() => setCurrentScreen('dashboard')}
            onNavigateHome={() => setCurrentScreen('dashboard')}
            onNavigateToAttendance={() => setCurrentScreen('attendance')}
            onNavigateToLeave={() => setCurrentScreen('leave_request')}
            onNavigateToProfile={() => setCurrentScreen('profile')}
          />
        )}

        {currentScreen === 'my_leave_requests' && (
          <MyLeaveRequestsScreen 
            onBack={() => setCurrentScreen('dashboard')}
            onNavigateHome={() => setCurrentScreen('dashboard')}
            onNavigateToAttendance={() => setCurrentScreen('attendance')}
            onNavigateToLeave={() => setCurrentScreen('leave_request')}
            onNavigateToProfile={() => setCurrentScreen('profile')}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen 
            userProfileData={globalUserData}
            onSignOut={() => setCurrentScreen('login')}
            onNavigateHome={() => setCurrentScreen('dashboard')}
            onNavigateToAttendance={() => setCurrentScreen('attendance')}
            onNavigateToLeave={() => setCurrentScreen('leave_request')}
            onNavigateToProfile={() => setCurrentScreen('profile')}
            onNavigateToChangePassword={() => setCurrentScreen('change_password')}
            onNavigateToPrivacy={() => setCurrentScreen('location_privacy')}
          />
        )}

        {currentScreen === 'change_password' && (
          <ChangePasswordScreen
            onBack={() => setCurrentScreen('profile')}
            serverAddress={serverAddress}
            employeeId={savedEmployeeId}
          />
        )}

        {currentScreen === 'location_privacy' && (
          <LocationPrivacyScreen
            onBack={() => setCurrentScreen('profile')}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FA' },
  topBanner: { backgroundColor: '#D92D20', paddingVertical: 6, alignItems: 'center', justifyContent: 'center' },
  topBannerText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});