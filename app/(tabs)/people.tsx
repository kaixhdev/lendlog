import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddRecordModal } from '@/components/AddRecordModal';
import { PersonCard } from '@/components/PersonCard';
import { PersonModal } from '@/components/PersonModal';
import { useStorage } from '@/context/StorageContext';
import { useColors } from '@/hooks/useColors';
import type { PersonStats, Record } from '@/types';

export default function PeopleScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { getPeople, settings, renamePerson, settleAllFor, deleteAllFor } =
    useStorage();

  const [selectedPerson, setSelectedPerson] = useState<PersonStats | null>(
    null,
  );
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [editRecord, setEditRecord] = useState<Record | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const people = getPeople();
  const currency = settings.currency;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleLongPress = (person: PersonStats) => {
    setSelectedPerson(person);
    setShowPersonModal(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, borderBottomColor: c.border },
        ]}
      >
        <Text
          style={[styles.title, { color: c.text, fontFamily: 'Inter_700Bold' }]}
        >
          People
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: c.text3, fontFamily: 'Inter_400Regular' },
          ]}
        >
          {people.length} contact{people.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={people}
        keyExtractor={(p) => p.name.toLowerCase()}
        scrollEnabled={people.length > 0}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 90 },
        ]}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="users" size={40} color={c.text3} />
            <Text
              style={[
                styles.emptyTitle,
                { color: c.text2, fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              No people yet
            </Text>
            <Text
              style={[
                styles.emptyText,
                { color: c.text3, fontFamily: 'Inter_400Regular' },
              ]}
            >
              Add a lending record to see people here
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <PersonCard
            person={item}
            currency={currency}
            onTap={(person) => {
              setSelectedPerson(person);
              setShowPersonModal(true);
            }}
            onLongPress={handleLongPress}
          />
        )}
      />

      <PersonModal
        person={selectedPerson}
        visible={showPersonModal}
        onClose={() => setShowPersonModal(false)}
        onEditRecord={(record) => {
          setEditRecord(record);
          setShowEditModal(true);
        }}
      />

      <AddRecordModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditRecord(null);
        }}
        initialType={editRecord?.type ?? 'lent'}
        editRecord={editRecord}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 2,
  },
  title: { fontSize: 28 },
  subtitle: { fontSize: 14 },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
