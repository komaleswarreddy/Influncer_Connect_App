import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/auth-store';
import { useRouter } from 'expo-router';

const NICHES = [
  'Fashion', 'Beauty', 'Lifestyle', 'Fitness', 'Health', 'Food', 'Travel', 'Technology', 'Gaming', 'Education',
  'Business', 'Finance', 'Entertainment', 'Sports', 'Music', 'Art', 'Photography', 'Parenting', 'Home & Decor', 'Automotive'
];
const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France', 'Japan', 'Brazil', 'Other'
];

export default function InfluencerRegisterScreen() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    instagram: '',
    youtube: '',
    niche: '',
    country: '',
    bio: '',
    agreedToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading, error } = useAuthStore();
  const router = useRouter();

  const validate = () => {
    if (!form.fullName || form.fullName.length < 2) return 'Name must be at least 2 characters';
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Invalid email address';
    if (!form.password || form.password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(form.password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(form.password)) return 'Password must contain at least one number';
    if (!/[^A-Za-z0-9]/.test(form.password)) return 'Password must contain at least one special character';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (!form.phone || form.phone.length < 10) return 'Phone number must be at least 10 digits';
    if (form.instagram && !/^https?:\/\/.+/.test(form.instagram)) return 'Invalid Instagram URL';
    if (form.youtube && !/^https?:\/\/.+/.test(form.youtube)) return 'Invalid YouTube URL';
    if (!form.niche) return 'Please select your niche';
    if (!form.country) return 'Please select a country';
    if (form.bio && form.bio.length > 500) return 'Bio must be less than 500 characters';
    if (!form.agreedToTerms) return 'You must agree to the terms and conditions';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }
    try {
      await register(form);
      Alert.alert('Registration Successful', 'Your account is pending approval or has been created.');
      router.replace('/dashboard');
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message || 'Please try again later.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Join as Influencer</Text>
      <TextInput style={styles.input} placeholder="Full Name" value={form.fullName} onChangeText={v => setForm(f => ({ ...f, fullName: v }))} />
      <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} secureTextEntry={!showPassword} />
      <TouchableOpacity onPress={() => setShowPassword(s => !s)}><Text style={styles.toggle}>{showPassword ? 'Hide' : 'Show'} Password</Text></TouchableOpacity>
      <TextInput style={styles.input} placeholder="Confirm Password" value={form.confirmPassword} onChangeText={v => setForm(f => ({ ...f, confirmPassword: v }))} secureTextEntry={!showConfirmPassword} />
      <TouchableOpacity onPress={() => setShowConfirmPassword(s => !s)}><Text style={styles.toggle}>{showConfirmPassword ? 'Hide' : 'Show'} Confirm Password</Text></TouchableOpacity>
      <TextInput style={styles.input} placeholder="Phone" value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Instagram Profile URL" value={form.instagram} onChangeText={v => setForm(f => ({ ...f, instagram: v }))} />
      <TextInput style={styles.input} placeholder="YouTube Profile URL" value={form.youtube} onChangeText={v => setForm(f => ({ ...f, youtube: v }))} />
      <Text style={styles.label}>Niche</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {NICHES.map(niche => (
          <TouchableOpacity key={niche} style={[styles.chip, form.niche === niche && styles.chipSelected]} onPress={() => setForm(f => ({ ...f, niche }))}>
            <Text style={form.niche === niche ? styles.chipTextSelected : styles.chipText}>{niche}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.label}>Country</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {COUNTRIES.map(country => (
          <TouchableOpacity key={country} style={[styles.chip, form.country === country && styles.chipSelected]} onPress={() => setForm(f => ({ ...f, country }))}>
            <Text style={form.country === country ? styles.chipTextSelected : styles.chipText}>{country}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TextInput style={[styles.input, { height: 80 }]} placeholder="Bio (optional, max 500 chars)" value={form.bio} onChangeText={v => setForm(f => ({ ...f, bio: v }))} multiline maxLength={500} />
      <View style={styles.checkboxRow}>
        <TouchableOpacity onPress={() => setForm(f => ({ ...f, agreedToTerms: !f.agreedToTerms }))} style={styles.checkbox}>
          <Text>{form.agreedToTerms ? '☑' : '☐'}</Text>
        </TouchableOpacity>
        <Text style={{ marginLeft: 8 }}>I agree to the terms and conditions</Text>
      </View>
      {isLoading ? <ActivityIndicator size="large" color="#00b894" /> : <Button title="Register" onPress={handleRegister} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity onPress={() => router.push('/login')}><Text style={styles.link}>Already have an account? Sign in</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  label: { fontWeight: 'bold', marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#ccc', marginRight: 8 },
  chipSelected: { backgroundColor: '#00b894', borderColor: '#00b894' },
  chipText: { color: '#333' },
  chipTextSelected: { color: '#fff' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  toggle: { color: '#0984e3', marginBottom: 8, textAlign: 'right' },
  error: { color: 'red', marginTop: 8, textAlign: 'center' },
  link: { color: '#0984e3', marginTop: 16, textAlign: 'center' },
}); 