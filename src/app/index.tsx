import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Novel Mentions</Text>
      <Text style={styles.subtitle}>Scaffold in place — theme layer and tabs land next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});
