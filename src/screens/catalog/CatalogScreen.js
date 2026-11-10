import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { catalogApi } from '../../api/services';
import { LoadingState, ErrorState, EmptyState, AppButton } from '../../components/UI';
import { getLocalBlockImage } from '../../utils/rockImages';
import { COLORS, SPACING, MIN_TOUCH_SIZE } from '../../theme/theme';

export default function CatalogScreen({ navigation }) {
  const [rocks, setRocks] = useState([]);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [minHardness, setMinHardness] = useState('');
  const [maxHardness, setMaxHardness] = useState('');

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRock, setSelectedRock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReferenceData = useCallback(async () => {
    try {
      const [typesRes, catsRes] = await Promise.all([
        catalogApi.listTypes(),
        catalogApi.listCategories()
      ]);
      setTypes(typesRes?.items || []);
      setCategories(catsRes?.items || []);
    } catch {
      // Ignorar fallo en filtros secundarios
    }
  }, []);

  const loadRocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (minHardness.trim() !== '' || maxHardness.trim() !== '') {
        const minVal = minHardness.trim() === '' ? 0 : Number(minHardness);
        const maxVal = maxHardness.trim() === '' ? 10 : Number(maxHardness);
        const list = await catalogApi.listByHardness(minVal, maxVal);
        setRocks(Array.isArray(list) ? list : []);
      } else {
        const res = await catalogApi.listRocks({
          typeId: selectedTypeId,
          categoryId: selectedCategoryId,
          search: searchQuery.trim() || undefined,
          limit: 100
        });
        setRocks(res?.items || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTypeId, selectedCategoryId, searchQuery, minHardness, maxHardness]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadRocks();
  }, [loadRocks]);

  // Recargar automáticamente cuando vuelves desde el escáner IA o la fusión
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadRocks();
    });
    return unsubscribe;
  }, [navigation, loadRocks]);

  const clearFilters = () => {
    setSelectedTypeId(null);
    setSelectedCategoryId(null);
    setSearchQuery('');
    setMinHardness('');
    setMaxHardness('');
    setShowFilterModal(false);
  };

  const getRockImageSource = (rock) => {
    if (rock?.imgUrl && rock.imgUrl.startsWith('http')) {
      return { uri: rock.imgUrl };
    }
    return getLocalBlockImage(rock);
  };

  const renderGridSlot = ({ item }) => {
    const isSelected = selectedRock?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.slot, isSelected && styles.slotActive]}
        onPress={() => setSelectedRock(item)}
        accessibilityRole="button"
        accessibilityLabel={`Seleccionar ${item.name}`}
      >
        <Image source={getRockImageSource(item)} style={styles.blockImage} />
        <Text style={styles.slotLabel} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.slotIndexBadge}>
          <Text style={styles.slotIndexText}>#{item.index}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const hasActiveFilters = Boolean(
    selectedTypeId || selectedCategoryId || searchQuery.trim() || minHardness.trim() || maxHardness.trim()
  );

  return (
    <View style={styles.container}>
      {/* Barra superior de búsqueda y botón de filtros */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar roca o mineral..."
            placeholderTextColor={COLORS.textSecondary}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setShowFilterModal(true)}
          accessibilityRole="button"
        >
          <Feather name="Sliders" size={18} color={hasActiveFilters ? '#FFF' : COLORS.primary} />
          <Text style={[styles.filterText, hasActiveFilters && { color: '#FFF' }]}>Filtros</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.countText}>
          {rocks.length} {rocks.length === 1 ? 'espécimen registrado' : 'especímenes registrados'}
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cuadrícula de bloques estilo Inventario */}
      {loading ? (
        <LoadingState message="Cargando inventario geológico..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadRocks} />
      ) : rocks.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          subtitle="No encontramos rocas con esos filtros."
          actionLabel="Restablecer filtros"
          onAction={clearFilters}
        />
      ) : (
        <FlatList
          data={rocks}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          renderItem={renderGridSlot}
          contentContainerStyle={[
            styles.gridContainer,
            selectedRock && { paddingBottom: 220 }
          ]}
          columnWrapperStyle={styles.rowWrapper}
        />
      )}

      {/* Panel inferior fijo estilo Pokémon al tocar una casilla */}
      {selectedRock && (
        <View style={styles.bottomPanel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelImgBox}>
              <Image source={getRockImageSource(selectedRock)} style={styles.panelImage} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.panelTitle}>{selectedRock.name}</Text>
              <Text style={styles.panelSub}>{selectedRock.scientificName}</Text>
              <View style={styles.badgeRow}>
                <Text style={styles.panelBadge}>Mohs: {selectedRock.hardness ?? 'Variable'}</Text>
                {selectedRock.type?.name ? (
                  <Text style={styles.panelTypeBadge}>{selectedRock.type.name}</Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity onPress={() => setSelectedRock(null)} style={styles.closeBtn}>
              <Feather name="x" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.panelDesc} numberOfLines={2}>
            {selectedRock.description || 'Espécimen geológico registrado en GeoDex.'}
          </Text>

          <AppButton
            title="Ver Ficha Técnica Completa"
            onPress={() =>
              navigation.navigate('RockDetail', {
                rockId: selectedRock.id,
                initialRock: selectedRock
              })
            }
            style={{ marginTop: SPACING.sm }}
          />
        </View>
      )}

      {/* Modal de Filtros */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar Catálogo</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Feather name="x" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.filterSectionTitle}>Tipo Geológico</Text>
              <View style={styles.chipWrap}>
                {types.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.chip, selectedTypeId === t.id && styles.chipActive]}
                    onPress={() => setSelectedTypeId(selectedTypeId === t.id ? null : t.id)}
                  >
                    <Text style={[styles.chipText, selectedTypeId === t.id && styles.chipTextActive]}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Categoría</Text>
              <View style={styles.chipWrap}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, selectedCategoryId === c.id && styles.chipActive]}
                    onPress={() => setSelectedCategoryId(selectedCategoryId === c.id ? null : c.id)}
                  >
                    <Text style={[styles.chipText, selectedCategoryId === c.id && styles.chipTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Dureza de Mohs (0 a 10)</Text>
              <View style={styles.hardnessRow}>
                <TextInput
                  value={minHardness}
                  onChangeText={setMinHardness}
                  placeholder="Mín (ej. 2)"
                  keyboardType="numeric"
                  style={styles.hardnessInput}
                />
                <Text style={{ marginHorizontal: 8, fontWeight: '800' }}>a</Text>
                <TextInput
                  value={maxHardness}
                  onChangeText={setMaxHardness}
                  placeholder="Máx (ej. 7)"
                  keyboardType="numeric"
                  style={styles.hardnessInput}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <AppButton
                title="Limpiar"
                variant="outline"
                onPress={clearFilters}
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <AppButton
                title="Aplicar"
                onPress={() => setShowFilterModal(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    gap: 6
  },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs
  },
  countText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  clearText: { fontSize: 13, fontWeight: '800', color: COLORS.danger },
  gridContainer: { padding: SPACING.md },
  rowWrapper: { justifyContent: 'flex-start', gap: 10, marginBottom: 10 },
  slot: {
    width: '31%',
    aspectRatio: 0.95,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#BEB8AC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative'
  },
  slotActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    elevation: 4
  },
  blockImage: { width: '68%', height: '68%', resizeMode: 'contain' },
  slotLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
    textAlign: 'center'
  },
  slotIndexBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  slotIndexText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 4,
    borderTopColor: COLORS.primary,
    padding: SPACING.md,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 }
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  panelImgBox: {
    width: 68,
    height: 68,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border
  },
  panelImage: { width: 54, height: 54, resizeMode: 'contain' },
  panelTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  panelSub: { fontSize: 13, fontStyle: 'italic', color: COLORS.textSecondary },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  panelBadge: {
    backgroundColor: COLORS.successBg,
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  panelTypeBadge: {
    backgroundColor: COLORS.guestBg,
    color: COLORS.guestBadge,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  closeBtn: { padding: 6 },
  panelDesc: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  chipTextActive: { color: '#FFF' },
  hardnessRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  hardnessInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: MIN_TOUCH_SIZE
  },
  modalActions: { flexDirection: 'row', marginTop: SPACING.lg }
});