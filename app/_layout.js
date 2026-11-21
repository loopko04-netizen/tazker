import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { initializeDatabase } from '../src/db/database';
import { useNotesStore } from '../src/store/notesStore';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const loadNotes = useNotesStore((state) => state.loadNotes);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initializeDatabase();
        await loadNotes();
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, [loadNotes]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F8F6' }}>
        <ActivityIndicator size="small" color="#55554F" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="editor" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
