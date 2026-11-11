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
import { Feather } from '@expo/vector-icons';
import { collectionApi, progressApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
  LoadingState,
  EmptyState,
  ErrorState,
  AppButton,
  GuestBanner
} from '../../components/UI';
import { getRockImageSource } from '../../utils/rockImages';
import { COLORS, SPACING } from '../../theme/theme';

export default function CollectionScreen({ navigation }) {
  const { isAuthenticated, isGuest, guestInfo } = useAuth();
  const [items, setItems] = useState([]);
  const [totalDistinct, setTotalDistinct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const rawList = res?.items || (Array.isArray(res) ? res : []);
        // Filtrar cualquier roca que haya sido eliminada por el administrador (entry.rock == null)
        const list = rawList.filter((entry) => entry && entry.rock && entry.rock.name);
        setItems(list);
        setTotalDistinct(list.length);

        const validIds = new Set(list.map((e) => e.rockId));
        if (list.length >= 2) {
          setRockId1((prev) => (validIds.has(prev) ? prev : list[0].rockId));
          setRockId2((prev) => (validIds.has(prev) ? prev : list[1].rockId));
        } else if (list.length === 1) {
          setRockId1(list[0].rockId);
          setRockId2(null);
        } else {
          setRockId1(null);
          setRockId2(null);
        }
      } else {
        const [stats, hist] = await Promise.all([
          progressApi.getStats(),
          progressApi.getHistory({ limit: 50 })
        ]);
        const map = new Map();
        for (const row of hist?.items || []) {
          if (!row.rock || !row.rock.name) continue;
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
        setTotalDistinct(guestList.length);
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
          <View style={styles.titleRow}>
            <Feather name="briefcase" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.summaryTitle}>
              {isAuthenticated
                ? 'Mi Colección Personal'
                : 'Mis Hallazgos en Sesión de Invitado'}
            </Text>
          </View>
          <Text style={styles.summarySub}>
            Toca cualquier roca para ver su ficha geológica. Total descubiertas:{' '}
            <Text style={styles.bold}>{totalDistinct}</Text>
          </Text>
        </View>
        {isAuthenticated ? (
          <AppButton
            title={showFusion ? 'Ocultar Fusión' : 'Mesa de Fusión'}
            variant="secondary"
            onPress={() => setShowFusion(!showFusion)}
          />
        ) : null}
      </View>

      {showFusion && isAuthenticated ? (
        <View style={styles.fusionCard}>
          <View style={styles.titleRow}>
            <Feather name="zap" size={18} color={COLORS.secondary} style={{ marginRight: 6 }} />
            <Text style={styles.fusionTitle}>Laboratorio de Fusión Geológica</Text>
          </View>
          {items.length < 2 ? (
            <Text style={styles.fusionSub}>
              Necesitas haber descubierto al menos 2 rocas diferentes en tu colección para poder fusionarlas (actualmente tienes {items.length}). Ve a "Reconocer" para descubrir más especímenes.
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

              {fusionError ? <Text style={styles.fusionError}>{fusionError}</Text> : null}

              {fusionResult ? (
                <View
                  style={[
                    styles.fusionSuccess,
                    (fusionResult.alreadyDiscovered || !fusionResult.newDiscovery) && styles.fusionWarning
                  ]}
                >
                  <Text
                    style={[
                      styles.fusionSuccessTitle,
                      (fusionResult.alreadyDiscovered || !fusionResult.newDiscovery) && {
                        color: COLORS.warning
                      }
                    ]}
                  >
                    {fusionResult.alreadyDiscovered || !fusionResult.newDiscovery
                      ? `Ya habías descubierto: ${fusionResult.discoveredItem}`
                      : `Nueva roca por fusión: ${fusionResult.discoveredItem}`}
                  </Text>
                  <Text style={styles.fusionSuccessMsg}>{fusionResult.message}</Text>
                  {fusionResult.rock ? (
                    <TouchableOpacity
                      style={styles.viewFusedBtn}
                      onPress={() =>
                        navigation.navigate('RockDetail', {
                          rockId: fusionResult.rock.id,
                          initialRock: fusionResult.rock
                        })
                      }
                    >
                      <Text style={styles.viewFusedBtnText}>Ver Ficha de la Roca →</Text>
                    </TouchableOpacity>
                  ) : null}
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
          title="Aún no has descubierto ninguna roca"
          description="El Catálogo muestra todas las rocas existentes, pero tu Colección solo guarda las que tú identificas. Ve a 'Reconocer' para registrar tu primer hallazgo."
          actionLabel="Ir a Reconocer Rocas"
          onAction={() => navigation.navigate('Recognition')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.rockId)}
          contentContainerStyle={{ padding: SPACING.md }}
          renderItem={({ item }) => {
            const isLockedByFusion = item.rock?.composition === 'LOCKED_BY_FUSION';
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate('RockDetail', {
                    rockId: item.rockId,
                    initialRock: item.rock
                  })
                }
                accessibilityRole="button"
              >
                <View style={styles.thumbBox}>
                  {getRockImageSource(item.rock) ? (
                    <Image source={getRockImageSource(item.rock)} style={styles.thumb} />
                  ) : (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <Feather
                        name={isLockedByFusion ? 'zap' : 'layers'}
                        size={28}
                        color={isLockedByFusion ? COLORS.warning : COLORS.primary}
                      />
                    </View>
                  )}
                </View>
                <View style={styles.info}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.rockName}>{item.rock?.name}</Text>
                    {isLockedByFusion ? (
                      <View style={styles.fusionPill}>
                        <Text style={styles.fusionPillText}>FUSIÓN (Falta Foto)</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.rockSci}>{item.rock?.scientificName}</Text>
                  {isLockedByFusion ? (
                    <Text style={styles.fusionHint}>
                      Descubierta por fusión. ¡Tómale una foto para desbloquear su información!
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.meta}>
                        Primer descubrimiento: <Text style={styles.bold}>{formatDate(item.firstDiscoveredAt)}</Text>
                      </Text>
                      <Text style={styles.meta}>
                        Veces identificada: <Text style={styles.bold}>{item.recognitionCount}</Text>
                      </Text>
                    </>
                  )}
                  <Text style={styles.tapDetailText}>Ver ficha geológica →</Text>
                </View>
              </TouchableOpacity>
            );
          }}
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
  titleRow: { flexDirection: 'row', alignItems: 'center' },
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
  fusionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  fusionSub: { fontSize: 13, color: COLORS.textSecondary, marginVertical: SPACING.xs, lineHeight: 18 },
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
  fusionError: { color: COLORS.danger, fontSize: 13, fontWeight: '700', marginVertical: 6 },
  fusionSuccess: {
    backgroundColor: COLORS.successBg || '#D4EDDA',
    padding: SPACING.sm,
    borderRadius: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.success
  },
  fusionWarning: {
    backgroundColor: COLORS.warningBg || '#FFF3CD',
    borderColor: COLORS.warning
  },
  fusionSuccessTitle: { fontSize: 14, fontWeight: '800', color: COLORS.success },
  fusionSuccessMsg: { fontSize: 13, color: COLORS.text, marginTop: 2 },
  viewFusedBtn: { marginTop: 6 },
  viewFusedBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border
  },
  thumbBox: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  thumb: { width: 64, height: 64, resizeMode: 'contain' },
  info: { flex: 1, marginLeft: SPACING.sm, justifyContent: 'center' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rockName: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  rockSci: { fontSize: 13, fontStyle: 'italic', color: COLORS.textSecondary, marginBottom: 4 },
  fusionPill: {
    backgroundColor: COLORS.warningBg || '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  fusionPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.warning
  },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  fusionHint: { fontSize: 12, color: COLORS.warning, fontWeight: '700', marginTop: 2 },
  tapDetailText: { fontSize: 12, fontWeight: '800', color: COLORS.primary, marginTop: 6 }
});