import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // أضف هنا منطق التحقق الفعلي
    alert(`تسجيل الدخول باسم: ${username}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>تسجيل الدخول</Text>
      <TextInput
        placeholder="اسم المستخدم"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        placeholder="كلمة المرور"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="دخول" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  header:    { fontSize: 22, textAlign: 'center', marginBottom: 20 },
  input:     { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 15, padding: 10 },
});
