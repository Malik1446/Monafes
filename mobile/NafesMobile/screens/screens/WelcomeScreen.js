import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>مرحبًا في تطبيق منافس!</Text>
      <Text style={styles.subtitle}>هذة النسخة تجريبية للأندرويد</Text>
      <Button title="التالي" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title:     { fontSize: 24, marginBottom: 10 },
  subtitle:  { fontSize: 16, marginBottom: 20 },
});
