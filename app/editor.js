import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useNotesStore } from '../src/store/notesStore';
import { palette } from '../src/theme/colors';

export default function EditorScreen() {
  const { id } = useLocalSearchParams();
  const note = useNotesStore((s) => s.notes.find((n) => String(n.id) === String(id)));
  const createNote = useNotesStore((s) => s.createNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [noteId, setNoteId] = useState(id ? Number(id) : null);
  const [dark, setDark] = useState(false);
  const [saving, setSaving] = useState(false);
  const creatingRef = useRef(false);
  const queuedRef = useRef(null);
  const c = dark ? palette.dark : palette.light;

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setNoteId(note.id);
    }
  }, [note?.id]);

  const persist = async (nextTitle, nextContent) => {
    if (!nextTitle.trim() && !nextContent.trim()) return;
    if (!noteId && creatingRef.current) {
      queuedRef.current = { title: nextTitle, content: nextContent };
      return;
    }
    setSaving(true);
    try {
      if (noteId) {
        await updateNote(noteId, nextTitle, nextContent);
      } else {
        creatingRef.current = true;
        const created = await createNote(nextTitle, nextContent);
        setNoteId(created.id);
        router.setParams({ id: String(created.id) });
        creatingRef.current = false;
        const queued = queuedRef.current;
        queuedRef.current = null;
        if (queued && (queued.title !== nextTitle || queued.content !== nextContent)) {
          await updateNote(created.id, queued.title, queued.content);
        }
      }
    } finally {
      creatingRef.current = false;
      setSaving(false);
    }
  };

  const onTitleChange = (value) => {
    setTitle(value);
    persist(value, content);
  };
  const onContentChange = (value) => {
    setContent(value);
    persist(title, value);
  };

  const confirmDelete = () => {
    if (!noteId) { router.back(); return; }
    Alert.alert('حذف الملاحظة', 'هل تريد حذف هذه الملاحظة؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        await deleteNote(noteId);
        router.back();
      }}
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.toolbar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.toolButton}>
            <Ionicons name="chevron-forward" size={25} color={c.text} />
          </Pressable>
          <View style={styles.toolbarRight}>
            <Text style={[styles.saveState, { color: c.faint }]}>{saving ? 'جارٍ الحفظ…' : 'حفظ تلقائي'}</Text>
            <Pressable onPress={() => setDark((v) => !v)} hitSlop={12} style={styles.toolButton}>
              <Ionicons name={dark ? 'sunny-outline' : 'moon-outline'} size={20} color={c.text} />
            </Pressable>
            <Pressable onPress={confirmDelete} hitSlop={12} style={styles.toolButton}>
              <Ionicons name="trash-outline" size={20} color={c.muted} />
            </Pressable>
          </View>
        </View>

        <View style={styles.editor}>
          <TextInput
            value={title}
            onChangeText={onTitleChange}
            placeholder="العنوان"
            placeholderTextColor={c.faint}
            style={[styles.titleInput, { color: c.text }]}
            textAlign="right"
            multiline
            returnKeyType="next"
            blurOnSubmit={false}
          />
          <TextInput
            value={content}
            onChangeText={onContentChange}
            placeholder="ابدأ الكتابة…"
            placeholderTextColor={c.faint}
            style={[styles.contentInput, { color: c.text }]}
            textAlign="right"
            multiline
            textAlignVertical="top"
            scrollEnabled
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  safe: { flex: 1 },
  toolbar: { height: 54, paddingHorizontal: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  toolButton: { minWidth: 28, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  saveState: { fontSize: 11 },
  editor: { flex: 1, paddingHorizontal: 25, paddingTop: 26 },
  titleInput: { fontSize: 25, lineHeight: 36, fontWeight: '800', paddingVertical: 5, minHeight: 48, textAlignVertical: 'top' },
  contentInput: { flex: 1, fontSize: 16, lineHeight: 29, paddingTop: 18, paddingBottom: 30, textAlignVertical: 'top' }
};
