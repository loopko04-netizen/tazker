import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList, Alert,
  Keyboard, Platform, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotesStore } from '../src/store/notesStore';
import { palette } from '../src/theme/colors';

const formatDate = (value) => {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' });
};

export default function HomeScreen() {
  const notes = useNotesStore((s) => s.notes);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const restoreNote = useNotesStore((s) => s.restoreNote);
  const togglePin = useNotesStore((s) => s.togglePin);
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(false);
  const [deletedId, setDeletedId] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const c = dark ? palette.dark : palette.light;

  const visibleNotes = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return notes
      .filter((n) => !n.is_deleted)
      .filter((n) => !q || `${n.title || ''} ${n.content || ''}`.toLocaleLowerCase().includes(q))
      .sort((a, b) => (Number(b.is_pinned) - Number(a.is_pinned)) || (b.updated_at - a.updated_at));
  }, [notes, query]);

  const askDelete = (note) => {
    Alert.alert('حذف الملاحظة', 'صدك تحجي؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        await deleteNote(note.id);
        setDeletedId(note.id);
      }}
    ]);
  };

  const undoDelete = async () => {
    if (deletedId) {
      await restoreNote(deletedId);
      setDeletedId(null);
    }
  };

  const renderNote = ({ item }) => {
    const title = item.title?.trim() || 'ملاحظة مابيها عنوان';
    const preview = item.content?.trim() || 'ماكو محتوى';
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/editor', params: { id: String(item.id) } })}
        onLongPress={() => askDelete(item)}
        style={({ pressed }) => [styles.noteRow, { opacity: pressed ? 0.65 : 1, borderBottomColor: c.line }]}
      >
        <View style={styles.noteText}>
          <View style={styles.titleLine}>
            <Text numberOfLines={1} style={[styles.noteTitle, { color: c.text }]}>{title}</Text>
            {item.is_pinned ? <Ionicons name="pin" size={14} color={c.muted} style={{ marginStart: 7 }} /> : null}
          </View>
          <Text numberOfLines={2} style={[styles.preview, { color: c.muted }]}>{preview}</Text>
          <Text style={[styles.date, { color: c.faint }]}>{formatDate(item.updated_at)}</Text>
        </View>
        <Pressable hitSlop={12} onPress={() => togglePin(item.id)} style={styles.pinButton}>
          <Ionicons name={item.is_pinned ? 'pin' : 'pin-outline'} size={18} color={item.is_pinned ? c.text : c.faint} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <View>
          <Text style={[styles.brand, { color: c.text }]}>تذكير</Text>
          <Text style={[styles.subtitle, { color: c.muted }]}>مساحة هادئة لأفكارك</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => { setShowSearch((v) => !v); setQuery(''); }} hitSlop={10} style={styles.iconButton}>
            <Ionicons name={showSearch ? 'close' : 'search-outline'} size={21} color={c.text} />
          </Pressable>
          <Pressable onPress={() => setDark((v) => !v)} hitSlop={10} style={styles.iconButton}>
            <Ionicons name={dark ? 'sunny-outline' : 'moon-outline'} size={20} color={c.text} />
          </Pressable>
        </View>
      </View>

      {showSearch && (
        <View style={[styles.searchWrap, { backgroundColor: c.surface, borderColor: c.line }]}>
          <Ionicons name="search-outline" size={18} color={c.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="دور بـــملاحظاتك"
            placeholderTextColor={c.faint}
            style={[styles.searchInput, { color: c.text }]}
            textAlign="right"
            autoFocus
            returnKeyType="search"
          />
          {!!query && <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={17} color={c.faint} /></Pressable>}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>ملاحظاتي</Text>
        <Text style={[styles.count, { color: c.faint }]}>{visibleNotes.length}</Text>
      </View>

      <FlatList
        data={visibleNotes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNote}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.listContent, visibleNotes.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={35} color={c.faint} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>{query ? 'ماكو نتائج' : 'لا توجد ملاحظات بعد'}</Text>
            <Text style={[styles.emptyText, { color: c.muted }]}>{query ? 'جرّب غير شي' : 'بلش بكتابة أول ملاحظة لك'}</Text>
          </View>
        }
      />

      {deletedId !== null && (
        <View style={[styles.undoBar, { backgroundColor: c.inverse }]}>
          <Text style={[styles.undoText, { color: c.inverseText }]}>تم رمي الملاحظة بالزبالة</Text>
          <Pressable onPress={undoDelete}><Text style={[styles.undoAction, { color: c.inverseText }]}>تراجع</Text></Pressable>
          <Pressable onPress={() => setDeletedId(null)}><Ionicons name="close" size={18} color={c.inverseText} /></Pressable>
        </View>
      )}

      <Pressable
        onPress={() => { Keyboard.dismiss(); router.push('/editor'); }}
        style={({ pressed }) => [styles.fab, { backgroundColor: c.accent, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
        accessibilityRole="button"
        accessibilityLabel="إضافة ملاحظة"
      >
        <Ionicons name="add" size={29} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = {
  safe: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 15, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, textAlign: 'right' },
  subtitle: { fontSize: 13, marginTop: 5, textAlign: 'right' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconButton: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { marginHorizontal: 22, marginBottom: 22, borderWidth: 1, borderRadius: 13, minHeight: 46, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 9 },
  sectionHeader: { paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 7 },
  sectionTitle: { fontSize: 17, fontWeight: '700', textAlign: 'right' },
  count: { fontSize: 12 },
  listContent: { paddingHorizontal: 22, paddingBottom: 110, flexGrow: 1 },
  emptyList: { justifyContent: 'center' },
  noteRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 17 },
  noteText: { flex: 1, alignItems: 'flex-end' },
  titleLine: { flexDirection: 'row', alignItems: 'center', maxWidth: '100%' },
  noteTitle: { fontSize: 16, fontWeight: '700', textAlign: 'right', maxWidth: '95%' },
  preview: { fontSize: 13, lineHeight: 21, marginTop: 6, textAlign: 'right', alignSelf: 'stretch' },
  date: { fontSize: 11, marginTop: 7, textAlign: 'right', alignSelf: 'stretch' },
  pinButton: { width: 35, height: 45, alignItems: 'center', justifyContent: 'center', marginEnd: 5 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 15 },
  emptyText: { fontSize: 13, marginTop: 7 },
  fab: { position: 'absolute', bottom: 28, right: 23, width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 9, shadowOffset: { width: 0, height: 4 } },
  undoBar: { position: 'absolute', bottom: 100, left: 20, right: 20, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  undoText: { fontSize: 13 },
  undoAction: { fontSize: 13, fontWeight: '700', marginStart: 'auto', marginEnd: 18 }
};
