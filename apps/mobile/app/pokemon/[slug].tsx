import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  getSpecies, getFormsForSpecies, getMegaForms, defensiveProfile, STAT_KEYS, TYPES,
  type ResolvedForm,
} from '@battlepad/core';
import type { PokemonType, StatBlock } from '@battlepad/data';
import { TypeRow, StatBar, TypeBadge } from '../../src/components';
import { colors, typeColor } from '../../src/theme';

export default function PokemonScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const species = getSpecies(slug);

  if (!species) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={styles.dim}>No data for “{slug}”.</Text>
      </View>
    );
  }

  const speciesForms = getFormsForSpecies(slug);
  const baseForm = speciesForms.find((f) => !f.isMega) ?? speciesForms[0];
  const baseTypes = baseForm?.types ?? [];
  const baseBlock = species.statBlocks[0];
  const defaultAbilities = species.abilities.forms['default'] ?? [];
  const megas = getMegaForms(slug);
  const standardMoves = species.moves.find((m) => /standard/i.test(m.form)) ?? species.moves[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: species.name }} />

      <Text style={styles.title}>{species.name}</Text>
      <Text style={styles.dexNo}>#{String(species.natdex).padStart(4, '0')}</Text>
      <TypeRow types={baseTypes} />

      {defaultAbilities.length > 0 && (
        <Section title="Abilities">
          <Text style={styles.body}>{defaultAbilities.map((a) => a.name).join(' · ')}</Text>
        </Section>
      )}

      {baseBlock && (
        <Section title={`Base Stats · ${baseBlock.total} total`}>
          <StatBlockView block={baseBlock} />
        </Section>
      )}

      {baseTypes.length > 0 && (
        <Section title="Weaknesses">
          <Weaknesses types={baseTypes} />
        </Section>
      )}

      {megas.map((mega) => (
        <MegaCard key={mega.formId} mega={mega} block={blockFor(species.statBlocks, mega)} />
      ))}

      {standardMoves && (
        <Section title={`Moves · ${standardMoves.moves.length}`}>
          <View style={styles.chips}>
            {standardMoves.moves.map((m) => (
              <View key={m.slug} style={styles.chip}>
                <Text style={styles.chipText}>{m.name}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}
    </ScrollView>
  );
}

function blockFor(blocks: StatBlock[], mega: ResolvedForm): StatBlock | undefined {
  return blocks.find((b) => b.label.toLowerCase() === mega.displayName.toLowerCase());
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StatBlockView({ block }: { block: StatBlock }) {
  return (
    <View>
      {STAT_KEYS.map((k) => (
        <StatBar key={k} stat={k} value={block.base[k]} />
      ))}
    </View>
  );
}

function MegaCard({ mega, block }: { mega: ResolvedForm; block: StatBlock | undefined }) {
  return (
    <View style={styles.megaCard}>
      <Text style={styles.megaTitle}>{mega.displayName}</Text>
      <TypeRow types={mega.types} />
      {mega.abilities.length > 0 && (
        <Text style={styles.megaAbility}>Ability: {mega.abilities.map((a) => a.name).join(' / ')}</Text>
      )}
      {block && (
        <View style={{ marginTop: 6 }}>
          <StatBlockView block={block} />
        </View>
      )}
    </View>
  );
}

function Weaknesses({ types }: { types: PokemonType[] }) {
  const profile = defensiveProfile(types);
  const weak = TYPES.filter((t) => profile[t] > 1);
  if (weak.length === 0) return <Text style={styles.dim}>None</Text>;
  return (
    <View style={styles.chips}>
      {weak.map((t) => (
        <View key={t} style={styles.weakItem}>
          <TypeBadge type={t} />
          <Text style={[styles.multiplier, { color: typeColor(t) }]}>×{profile[t]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  dexNo: { color: colors.textDim, fontSize: 14, marginTop: 2 },
  section: { marginTop: 20 },
  sectionTitle: { color: colors.accent, fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  body: { color: colors.text, fontSize: 15 },
  dim: { color: colors.textDim, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: colors.border },
  chipText: { color: colors.text, fontSize: 13 },
  weakItem: { flexDirection: 'row', alignItems: 'center', marginRight: 8, marginBottom: 4 },
  multiplier: { fontSize: 13, fontWeight: '800', marginLeft: 2 },
  megaCard: { marginTop: 20, backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  megaTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  megaAbility: { color: colors.textDim, fontSize: 14, marginTop: 6 },
});
