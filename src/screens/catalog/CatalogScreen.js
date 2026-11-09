import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { catalogApi } from '../../api/services';
import { LoadingState, ErrorState, AppButton } from '../../components/UI';
import { COLORS, SPACING, MIN_TOUCH_SIZE } from '../../theme/theme';

// Simulador de imágenes de bloques de Minecraft basadas en las que mostraste
const getBlockImage = (name) => {
  const norm = name.toLowerCase();
  if (norm.includes('basalto')) return 'https://static.wikia.nocookie.net/minecraft_es_gamepedia/images/c/c8/Bloque_de_basalto.png';
  if (norm.includes('granito')) return 'https://static.wikia.nocookie.net/minecraft_es_gamepedia/images/4/43/Granito.png';
  if (norm.includes('arenisca')) return 'https://static.wikia.nocookie.net/minecraft_es_gamepedia/images/4/46/Arenisca.png';
  if (norm.includes('pizarra')) return 'https://static.wikia.nocookie.net/minecraft_es_gamepedia/images/0/07/Pizarra_profunda.png';
  return 'https://via.placeholder.com/80x80.png?text=Bloque'; // Roca genérica
};

export default function CatalogScreen({ navigation }) {
  const [rocks, setRocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para el panel inferior (Pokémon style)
  const [selectedRock, setSelectedRock] = useState(null);

  const loadRocks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogApi.listRocks({ limit: 100 });
      setRocks(res?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRocks(); }, [loadRocks]);

  const renderGridSlot = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.slot,
        selectedRock?.id === item.id && styles.slotActive
      ]}
      onPress={() => setSelectedRock(item)}
      accessibilityRole="button"
    >
      <Image source={{ uri: getBlockImage(item.name) }} style={styles.blockImage} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Barra de Filtros Minimalista */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterBtn}>
          <Feather name="filter" size={20} color={COLORS.textSecondary} />
          <Text style={styles.filterText}>Filtros</Text>
        </TouchableOpacity>
        <Text style={styles.countText}>{rocks.length} Rocas descubiertas</Text>
      </View>

      {/* Grid del Inventario */}
      {loading ? (
        <LoadingState message="Cargando inventario geológico..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadRocks} />
      ) : (
        <FlatList
          data={rocks}
          keyExtractor={(item) => String(item.id)}
          numColumns={4}
          renderItem={renderGridSlot}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.rowWrapper}
        />
      )}

      {/* Panel Inferior de Detalles (Pokémon Style) */}
      {selectedRock && (
        <View style={styles.bottomPanel}>
          <View style={styles.panelHeader}>
            <Image source={{ uri: getBlockImage(selectedRock.name) }} style={styles.panelImage} />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={styles.panelTitle}>{selectedRock.name}</Text>
              <Text style={styles.panelSub}>{selectedRock.scientificName}</Text>
              <Text style={styles.panelBadge}>Mohs {selectedRock.hardness}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedRock(null)} style={styles.closeBtn}>
              <Feather name="x" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.panelDesc} numberOfLines={2}>
            {selectedRock.description || 'Una roca sólida del subsuelo.'}
          </Text>

          <AppButton
            title="Ver Ficha Técnica"
            onPress={() => navigation.navigate('RockDetail', { rockId: selectedRock.id, initialRock: selectedRock })}
            style={{ marginTop: SPACING.sm }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterBtn: { flexDirection: 'row', alignItems: 'center', padding: 6 },
  filterText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginLeft: 6 },
  countText: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },
  gridContainer: { padding: SPACING.md },
  rowWrapper: { justifyContent: 'flex-start', gap: 10, marginBottom: 10 },
  slot: {
    width: '22.5%', // 4 columnas
    aspectRatio: 1, // Cuadrado perfecto
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotActive: { borderColor: COLORS.primary, backgroundColor: COLORS.surface },
  blockImage: { width: '80%', height: '80%', resizeMode: 'contain' },
  
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 4,
    borderTopColor: COLORS.primary,
    padding: SPACING.md,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
  },
  panelHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm },
  panelImage: { width: 56, height: 56, backgroundColor: COLORS.background, borderRadius: 8 },
  panelTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  panelSub: { fontSize: 13, fontStyle: 'italic', color: COLORS.textSecondary },
  panelBadge: { 
    alignSelf: 'flex-start', 
    backgroundColor: COLORS.successBg, 
    color: COLORS.success, 
    fontSize: 11, 
    fontWeight: '800', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 4, 
    marginTop: 4 
  },
  closeBtn: { padding: 4 },
  panelDesc: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
});