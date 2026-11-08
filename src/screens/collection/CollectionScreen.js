import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collectionApi, progressApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
  LoadingState,
  EmptyState,
  ErrorState,
  AppButton,
  GuestBanner
} from '../../components/UI';
import { COLORS, SPACING } from '../../theme/theme';

export default function CollectionScreen({ navigation }) {
  const { isAuthenticated, isGuest, guestInfo } = useAuth();
  const [items, setItems] = useState([]);
  const [totalDistinct, setTotalDistinct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para Laboratorio de Fusión (Alquimia)
  const [showFusion, setShowFusion] = useState(true);
  const [rockId1, setRockId1] = useState(null);
  const [rockId2, setRockId2] = useState(null);
  const [fusing, setFusing] = useState(false);
  const [fusionResult, setFusionResult] = useState(null);
  const [fusionError, setFusionError] = useState(null);

  const loadCollection = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAuthenticated) {
        const res = await collectionApi.getMyCollection();
        const list = res?.items || [];
        setItems(list);
        setTotalDistinct(res?.total ?? list.length);
        if (list.length >= 2) {
          setRockId1((prev) => prev || list[0].rockId);
          setRockId2((prev) => prev || list[1].rockId);
        } else if (list.length === 1) {
          setRockId1(list[0].rockId);
        }
      } else {
        const [stats, hist] = await Promise.all([
          progressApi.getStats(),
          progressApi.getHistory({ limit: 50 })
        ]);
        const map = new Map();
        for (const row of hist?.items || []) {
          if (!row.rock) continue;
          const existing = map.get(row.rockId);
          if (existing) {
            existing.recognitionCount += 1;
            if (new Date(row.createdAt) < new Date(existing.firstDiscoveredAt)) {
              existing.firstDiscoveredAt = row.createdAt;
            }
          } else {
            map.set(row.rockId, {
              id: row.id,
              rockId: row.rockId,
              rock: row.rock,
              recognitionCount: 1,
              firstDiscoveredAt: row.createdAt
            });
          }
        }
        const guestList = Array.from(map.values());
        setItems(guestList);
        setTotalDistinct(stats?.distinctRocks ?? guestList.length);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      loadCollection();
    }, [loadCollection])
  );

  const handleFuse = async () => {
    setFusionError(null);
    setFusionResult(null);
    if (!rockId1 || !rockId2) {
      setFusionError('Selecciona dos rocas de tu colección.');
      return;
    }
    if (Number(rockId1) === Number(rockId2)) {
      setFusionError('Debes elegir dos rocas distintas para fusionarlas.');
      return;
    }

    setFusing(true);
    try {
      const res = await collectionApi.fuseRocks(rockId1, rockId2);
      setFusionResult(res);
      await loadCollection();
    } catch (err) {
      setFusionError(err.message);
    } finally {
      setFusing(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'Reciente';
    try {
      return new Date(iso).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return String(iso).slice(0, 10);
    }
  };

  if (loading) return <LoadingState message="Cargando tu colección de especímenes..." />;
  if (error) return <ErrorState message={error} onRetry={loadCollection} />;

  return (
    <View style={styles.container}>
      {isGuest ? (
        <GuestBanner
          guestInfo={guestInfo}
          onUpgradePress={() => navigation.navigate('GuestUpgrade')}
        />
      ) : null}

      <View style={styles.summaryHeader}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.summaryTitle}>
            {isAuthenticated
              ? '⛏️ Mi Colección Personal (Especímenes Descubiertos)'
              : '⛏️ Mis Hallazgos en Sesión de Invitado'}
          </Text>
          <Text style={styles.summarySub}>
            A diferencia del Catálogo general, aquí solo aparecen las rocas que tú has identificado. Total descubiertas: <Text style={styles.bold}>{totalDistinct}</Text>
          </Text>
        </View>
        {isAuthenticated ? (
          <AppButton
            title={showFusion ? 'Ocultar Fusión' : '⚗️ Laboratorio Fusión'}
            variant="secondary"
            onPress={() => setShowFusion(!showFusion)}
          />
        ) : null}
      </View>

      {showFusion && isAuthenticated ? (
        <View style={styles.fusionCard}>
          <Text style={styles.fusionTitle}>⚗️ Laboratorio de Fusión Geológica (/collection/fusion)</Text>
          {items.length < 2 ? (
            <Text style={styles.fusionSub}>
              Necesitas haber descubierto al menos 2 rocas diferentes en tu colección para poder fusionarlas (actualmente tienes {items.length}). Ve a la pestaña "Reconocer" para descubrir más especímenes.
            </Text>
          ) : (
            <>
              <Text style={styles.fusionSub}>
                Elige dos rocas descubiertas de tu colección para combinarlas mediante presión y temperatura:
              </Text>

              <Text style={styles.pickLabel}>1. Primera roca de tu colección:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {items.map((entry) => (
                  <TouchableOpacity
                    key={`r1-${entry.rockId}`}
                    style={[styles.chip, rockId1 === entry.rockId && styles.chipActive]}
                    onPress={() => setRockId1(entry.rockId)}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.chipText, rockId1 === entry.rockId && styles.chipTextActive]}>
                      {entry.rock?.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.pickLabel}>2. Segunda roca de tu colección:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {items.map((entry) => (
                  <TouchableOpacity
                    key={`r2-${entry.rockId}`}
                    style={[styles.chip, rockId2 === entry.rockId && styles.chipActive]}
                    onPress={() => setRockId2(entry.rockId)}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.chipText, rockId2 === entry.rockId && styles.chipTextActive]}>
                      {entry.rock?.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {fusionError ? <Text style={styles.fusionError}>⚠ {fusionError}</Text> : null}
              {fusionResult ? (
                <View style={styles.fusionSuccess}>
                  <Text style={styles.fusionSuccessTitle}>
                    ✨ Resultado obtenido: {fusionResult.discoveredItem}
                  </Text>
                  <Text style={styles.fusionSuccessMsg}>{fusionResult.message}</Text>
                </View>
              ) : null}

              <AppButton
                title="Fusionar Especímenes Seleccionados"
                loading={fusing}
                onPress={handleFuse}
                style={{ marginTop: SPACING.xs }}
              />
            </>
          )}
        </View>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          icon="⛏️"
          title="Aún no has descubierto ninguna roca"
          description="El Catálogo muestra todas las rocas existentes, pero tu Colección solo guarda las que tú identificas. Ve a 'Reconocer' para registrar tu primer hallazgo."
          actionLabel="Ir a Reconocer Rocas"
          onAction={() => navigation.navigate('RecognitionTab')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.rockId)}
          contentContainerStyle={{ padding: SPACING.md }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('CatalogTab', {
                  screen: 'RockDetail',
                  params: { rockId: item.rockId, initialRock: item.rock }
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Ver detalles de ${item.rock?.name}, descubierta el ${formatDate(
                item.firstDiscoveredAt
              )}, reconocida ${item.recognitionCount} veces`}
            >
              <Image
                source={{
                  uri: item.rock?.imgUrl || 'https://via.placeholder.com/90x90.png?text=Roca'
                }}
                style={styles.thumb}
              />
              <View style={styles.info}>
                <Text style={styles.rockName}>{item.rock?.name || `Roca #${item.rockId}`}</Text>
                <Text style={styles.rockSci}>{item.rock?.scientificName}</Text>
                <Text style={styles.meta}>
                  📅 Primer descubrimiento: <Text style={styles.bold}>{formatDate(item.firstDiscoveredAt)}</Text>
                </Text>
                <Text style={styles.meta}>
                  🔄 Veces identificada por ti: <Text style={styles.bold}>{item.recognitionCount}</Text>
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  summaryHeader: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  summarySub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },
  bold: { fontWeight: '800', color: COLORS.primary },
  fusionCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.secondary
  },
  fusionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.secondary, marginBottom: 4 },
  fusionSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm, lineHeight: 18 },
  pickLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 4, marginBottom: 4 },
  chipRow: { marginBottom: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    marginRight: 8
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  chipTextActive: { color: '#FFFFFF' },
  fusionError: { color: COLORS.danger, fontSize: 13, fontWeight: '600', marginVertical: 6 },
  fusionSuccess: {
    backgroundColor: COLORS.successBg,
    padding: SPACING.sm,
    borderRadius: 10,
    marginVertical: 6
  },
  fusionSuccessTitle: { fontSize: 14, fontWeight: '800', color: COLORS.success },
  fusionSuccessMsg: { fontSize: 13, color: COLORS.text, marginTop: 2 },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  thumb: { width: 80, height: 80, borderRadius: 10, backgroundColor: COLORS.surfaceAlt },
  info: { flex: 1, marginLeft: SPACING.sm, justifyContent: 'center' },
  rockName: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  rockSci: { fontSize: 13, fontStyle: 'italic', color: COLORS.textSecondary, marginBottom: 4 },
  meta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }
});