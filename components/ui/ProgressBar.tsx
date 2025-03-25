import { View, StyleSheet } from 'react-native';

export default function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.container}>
      <View style={[styles.bar, { width: `${progress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 8,
    width: '90%', // ✅ Full width instead of a fixed 100px
    backgroundColor: '#95a5a6',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 10, // ✅ More spacing
  },
  bar: {
    height: '100%',
    backgroundColor: '#f1c40f',
  },
});
