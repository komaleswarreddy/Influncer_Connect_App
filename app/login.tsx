import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Linking, Alert, ActivityIndicator } from 'react-native';
import { Text, TextInput, Button, Checkbox, Dialog, Portal, Provider, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth-store';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
  remember: z.boolean().optional(),
  tenant: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const API_URL = 'http://10.126.155.236:3000'; // Changed from localhost to local IP for network access

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const { login, isLoading, error: authError } = useAuthStore();

  const { control, handleSubmit, setValue, formState: { errors, isValid } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false, tenant: '' },
    mode: 'onChange', // Validate on change
  });

  const onSubmit = async (data: LoginFormData) => {
    // Additional validation check
    if (!data.email || !data.password) {
      setError('Please enter both email and password');
      return;
    }
    
    if (data.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      console.log('Attempting login with form data:', { email: data.email, password: data.password ? '***' : 'empty' });
      await login(data.email, data.password);
      console.log('Login successful, navigating to dashboard');
      router.replace('/influencer/dashboard');
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetMsg(null);
    setResetLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      if (!res.ok) throw new Error('Failed to send password reset email.');
      setResetMsg('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setResetMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Provider>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Affiliate Platform</Text>
          {/* Mode toggle can be added here if needed */}
        </View>
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Enter your credentials to access your account</Text>
            <View style={{ height: 16 }} />
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Email"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  error={!!errors.email}
                  style={styles.input}
                  disabled={loading}
                />
              )}
            />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
            <View style={{ height: 8 }} />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Password"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
                  error={!!errors.password}
                  style={styles.input}
                  disabled={loading}
                />
              )}
            />
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
            <View style={styles.row}>
              <Controller
                control={control}
                name="remember"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.checkboxRow}>
                    <Checkbox
                      status={value ? 'checked' : 'unchecked'}
                      onPress={() => onChange(!value)}
                      disabled={loading}
                    />
                    <Text style={styles.checkboxLabel}>Remember me</Text>
                  </View>
                )}
              />
              <TouchableOpacity onPress={() => setForgotVisible(true)} disabled={loading}>
                <Text style={styles.forgot}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            {authError && <Text style={styles.error}>{authError}</Text>}
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.button}
              contentStyle={{ paddingVertical: 8 }}
              disabled={loading || !isValid}
            >
              Sign In
            </Button>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.divider} />
            </View>
            <Button
              mode="outlined"
              style={styles.button}
              icon={() => <MaterialCommunityIcons name="account-plus" size={20} color={theme.colors.primary} />}
              onPress={() => router.push('/register/influencer')}
              disabled={loading}
            >
              Join as Influencer
            </Button>
            {/*
            <Button
              mode="outlined"
              style={styles.button}
              icon={() => <MaterialCommunityIcons name="star-outline" size={20} color={theme.colors.primary} />}
              onPress={() => router.push('/rate-my-rate')}
              disabled={loading}
            >
              Rate my Rate
            </Button>
            */}
          </View>
        </View>
        <Portal>
          <Dialog visible={forgotVisible} onDismiss={() => setForgotVisible(false)}>
            <Dialog.Title>Reset Password</Dialog.Title>
            <Dialog.Content>
              <Text>Enter your email to receive password reset instructions.</Text>
              <TextInput
                label="Email"
                mode="outlined"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                disabled={resetLoading}
              />
              {resetMsg && <Text style={styles.error}>{resetMsg}</Text>}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handlePasswordReset} loading={resetLoading} disabled={resetLoading}>
                Send Email
              </Button>
              <Button onPress={() => setForgotVisible(false)} disabled={resetLoading}>
                Cancel
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <View style={styles.footer}>
          <Text style={styles.footerText}>&copy; {new Date().getFullYear()} Affiliate Platform. All rights reserved.</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://your-terms-url.com')}><Text style={styles.footerLink}>Terms</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://your-privacy-url.com')}><Text style={styles.footerLink}>Privacy</Text></TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00796b',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf6',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00796b',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    marginBottom: 0,
    backgroundColor: '#f9f9f9',
  },
  error: {
    color: 'red',
    fontSize: 13,
    marginBottom: 8,
    marginTop: 2,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  forgot: {
    color: '#00796b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  button: {
    marginVertical: 4,
    borderRadius: 8,
  },
  link: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
  },
  linkBold: {
    color: '#00796b',
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  dividerText: {
    marginHorizontal: 8,
    color: '#999',
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    color: '#999',
    fontSize: 13,
    marginBottom: 4,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  footerLink: {
    color: '#00796b',
    fontWeight: 'bold',
    marginHorizontal: 8,
    fontSize: 14,
  },
}); 