import { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { manifest } from '@battlepad/data';
import { searchCatalog, type CatalogEntry } from '../src/catalog';
import { TypeRow } from '../src/components';
import { colors } from '../src/theme';

export default function DexScreen() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchCatalog(query), [query]);

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Pokémon Champions · Reg {manifest.regulations.join(' / ')} ·{' '}
        {manifest.counts.species} species · {manifest.counts.forms} forms
      </Text>
      <TextInput
        style={styles.search}
        placeholder="Search by name or dex #"
        placeholderTextColor={colors.textDim}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <DexRow entry={item} />}
        ListEmptyComponent={<Text style={styles.empty}>No Pokémon match “{query}”.</Text>}
      />
    </View>
  );
}

function DexRow({ entry }: { entry: CatalogEntry }) {
  return (
    <Link href={`/pokemon/${entry.slug}`} asChild>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
        <Text style={styles.dexNo}>#{String(entry.natdex).padStart(4, '0')}</Text>
        <View style={styles.rowMain}>
          <View style={styles.rowTop}>
            <Text style={styles.name}>{entry.name}</Text>
            {entry.hasMega && (
              <View style={styles.megaTag}>
                <Text style={styles.megaTagText}>MEGA</Text>
              </View>
            )}
          </View>
          <TypeRow types={entry.types} />
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  subtitle: { color: colors.textDim, fontSize: 12, paddingHorizontal: 16, paddingTop: 10 },
  search: {
    margin: 12, marginTop: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: colors.card, color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.cardAlt },
  dexNo: { color: colors.textDim, fontSize: 12, width: 52, fontVariant: ['tabular-nums'] },
  rowMain: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  megaTag: { marginLeft: 8, backgroundColor: colors.accent, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 },
  megaTagText: { color: '#0f1220', fontSize: 10, fontWeight: '800' },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 40 },
});
