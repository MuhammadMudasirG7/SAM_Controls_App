import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function LoginAlert({ type, message }) {
  return (
    <View style={styles.errorBanner}>
      {type === 'lock' ? (
        <Feather name="lock" size={16} color="#D92D20" style={{ marginRight: 8 }} />
      ) : (
        <Ionicons name="warning" size={16} color="#D92D20" style={{ marginRight: 8 }} />
      )}
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3F2',
    borderColor: '#FECDCA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 24,
    marginTop: 15,
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
