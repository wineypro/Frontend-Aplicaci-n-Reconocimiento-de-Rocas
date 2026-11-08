import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView
} from 'react-native';
import { catalogApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
  LoadingState,
  EmptyState,
  ErrorState,
  GuestBanner,
  AppButton
} from '../../components/UI';
import { COLORS, SPACING, MIN_TOUCH_SIZE } from '../../theme/theme';

export default function CatalogScreen({ navigation }) {
  const { isGuest, guestInfo } = useAuth();
  const [rocks, setRocks] = useState([]);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [search, setSearch] = useState('');
  const [minHardness, setMinHardness] = useState('');
  const [maxHardness, setMaxHardness] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTaxonomies = useCallback(async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        catalogApi.listTypes(),
        catalogApi.listCategories()
      ]);
      setTypes(tRes?.items || []);
      setCategories(cRes?.items || []);
    } catch {
      // Taxonomías opcionales si falla la red inicial
    }
  }, []);

  const loadRocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (minHardness !== '' || maxHardness !== '') {
        const hRes = await catalogApi.filterByHardness(minHardness, maxHardness);
        setRocks(hRes?.rocks || []);
      } else {
        const res = await catalogApi.listRocks({
          limit: 50,
          typeId: selectedTypeId || undefined,
          categoryId: selectedCategoryId || undefined,
          search: search.trim() || undefined,
          searchBy: search.trim() ? 'name' : undefined
        });
        setRocks(res?.items || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTypeId, selectedCategoryId, search, minHardness, maxHardness]);

  useEffect(() => {
    loadTaxonomies();
  }, [loadTaxonomies]);

  useEffect(() => {
    loadRocks();
  }, [loadRocks]);

  const clearFilters = () => {
    setSelectedTypeId(null);
    setSelectedCategoryId(null);
    setSearch('');
    setMinHardness('');
    setMaxHardness('');
  };

  const getTypeName = (id) => types.find((t) => t.id === id)?.name || `Tipo #${id}`;
  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || `Categoría #${id}`;

  const renderRockItem = ({ item }) => (
    <TouchableOpacity
      style={styles.rockCard}
      onPress={() => navigation.navigate('RockDetail', { rockId: item.id, initialRock: item })}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalles de ${item.name}, dureza ${item.hardness} en escala de Mohs`}
    >
      <Image
        source={{ uri: item.imgUrl || 'https://via.placeholder.com/100x100.png?text=Roca' }}
        style={styles.rockThumb}
      />
      <View style={styles.rockInfo}>
        <View style={styles.rockHeaderRow}>
          <Text style={styles.rockIndex}>#{item.index}</Text>
          <Text style={styles.hardnessBadge}>Mohs {item.hardness}/10</Text>
        </View>
        <Text style={styles.rockName}>{item.name}</Text>
        <Text style={styles.rockSci}>{item.scientificName}</Text>
        <View style={styles.tagRow}>
          <Text style={styles.tag}>{getTypeName(item.typeId)}</Text>
          <Text style={styles.tagAlt}>{getCategoryName(item.categoryId)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isGuest ? (
        <GuestBanner
          guestInfo={guestInfo}
          onUpgradePress={() => navigation.navigate('GuestUpgrade')}
        />
      ) : null}

      <View style={styles.filterPanel}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar roca por nombre (ej. Basalto)..."
          placeholderTextColor="#7A8680"
          accessibilityLabel="Buscar roca por nombre"
          style={styles.searchInput}
        />

        <Text style={styles.filterTitle}>Filtrar por Tipo:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.chip, !selectedTypeId && styles.chipActive]}
            onPress={() => setSelectedTypeId(null)}
            accessibilityRole="button"
          >
            <Text style={[styles.chipText, !selectedTypeId && styles.chipTextActive]}>Todos</Text>
          </TouchableOpacity>
          {types.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.chip, selectedTypeId === t.id && styles.chipActive]}
              onPress={() => setSelectedTypeId(selectedTypeId === t.id ? null : t.id)}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, selectedTypeId === t.id && styles.chipTextActive]}>
                {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterTitle}>Filtrar por Categoría:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.chip, !selectedCategoryId && styles.chipActive]}
            onPress={() => setSelectedCategoryId(null)}
            accessibilityRole="button"
          >
            <Text style={[styles.chipText, !selectedCategoryId && styles.chipTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, selectedCategoryId === c.id && styles.chipActive]}
              onPress={() => setSelectedCategoryId(selectedCategoryId === c.id ? null : c.id)}
              accessibilityRole="button"
            >
              <Text
                style={[styles.chipText, selectedCategoryId === c.id && styles.chipTextActive]}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.hardnessRow}>
          <Text style={styles.filterTitle}>Dureza Mohs:</Text>
          <TextInput
            value={minHardness}
            onChangeText={setMinHardness}
            placeholder="Mín (1)"
            keyboardType="numeric"
            accessibilityLabel="Dureza mínima"
            style={styles.hardnessInput}
          />
          <Text style={{ marginHorizontal: 4, color: COLORS.textSecondary }}>a</Text>
          <TextInput
            value={maxHardness}
            onChangeText={setMaxHardness}
            placeholder="Máx (10)"
            keyboardType="numeric"
            accessibilityLabel="Dureza máxima"
            style={styles.hardnessInput}
          />
          {(selectedTypeId || selectedCategoryId || search || minHardness || maxHardness) ? (
            <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Limpiar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <LoadingState message="Consultando catálogo de rocas..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadRocks} />
      ) : rocks.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No se encontraron rocas"
          description="No existen especímenes que coincidan con los filtros seleccionados."
          actionLabel="Restablecer filtros"
          onAction={clearFilters}
        />
      ) : (
        <FlatList
          data={rocks}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRockItem}
          contentContainerStyle={{ padding: SPACING.md }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterPanel: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  searchInput: {
    minHeight: 44,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.xs
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 4
  },
  chipScroll: { marginBottom: 4 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    marginRight: 8,
    justifyContent: 'center'
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  chipTextActive: { color: '#FFFFFF' },
  hardnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  hardnessInput: {
    width: 76,
    minHeight: 38,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginLeft: 6,
    fontSize: 13,
    color: COLORS.text
  },
  clearBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.dangerBg,
    borderRadius: 8
  },
  clearBtnText: { color: COLORS.danger, fontSize: 12, fontWeight: '700' },
  rockCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: MIN_TOUCH_SIZE
  },
  rockThumb: {
    width: 82,
    height: 82,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt
  },
  rockInfo: { flex: 1, marginLeft: SPACING.sm, justifyContent: 'center' },
  rockHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rockIndex: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  hardnessBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  rockName: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  rockSci: { fontSize: 13, fontStyle: 'italic', color: COLORS.textSecondary, marginBottom: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6
  },
  tagAlt: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondary,
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  }
});