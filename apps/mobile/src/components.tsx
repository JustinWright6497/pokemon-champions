import { View, Text, StyleSheet } from 'react-native';
import type { PokemonType, StatKey } from '@battlepad/data';
import { colors, typeColor, STAT_LABELS } from './theme';

export function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <View style={[styles.badge, { backgroundColor: typeColor(type) }]}>
      <Text style={styles.badgeText}>{type.toUpperCase()}</Text>
    </View>
  );
}

export function TypeRow({ types }: { types: PokemonType[] }) {
  return (
    <View style={styles.typeRow}>
      {types.map((t) => (
        <TypeBadge key={t} type={t} />
      ))}
    </View>
  );
}

// A single base-stat bar (0–255 scale).
export function StatBar({ stat, value }: { stat: StatKey; value: number }) {
  const pct = Math.min(100, (value / 255) * 100);
  const hue = value >= 130 ? '#63bc5a' : value >= 90 ? '#f4d23c' : '#ff9d55';
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{STAT_LABELS[stat]}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { width: `${pct}%`, backgroundColor: hue }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 6 },
  badgeText: { color: '#0f1220', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  statLabel: { width: 38, color: colors.textDim, fontSize: 13, fontWeight: '700' },
  statValue: { width: 38, color: colors.text, fontSize: 13, fontVariant: ['tabular-nums'] },
  statTrack: { flex: 1, height: 8, backgroundColor: colors.cardAlt, borderRadius: 4, overflow: 'hidden' },
  statFill: { height: 8, borderRadius: 4 },
});
