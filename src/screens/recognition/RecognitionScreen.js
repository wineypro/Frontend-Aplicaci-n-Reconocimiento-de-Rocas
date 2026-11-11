import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { recognitionApi, feedbackApi } from '../../api/services';
import { AppButton, ErrorState, FormField } from '../../components/UI';
import { COLORS, SPACING } from '../../theme/theme';

export default function RecognitionScreen({ navigation }) {
  const { isGuest, guestInfo, refreshGuestStatus } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [limitReached, setLimitReached] = useState(false);

  const [isCorrect, setIsCorrect] = useState(true);
  const [comment, setComment] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  const pickFromGallery = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Necesitamos permiso para acceder a tu galería de fotos.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7
    });
    if (!res.canceled && res.assets?.length) {
      setSelectedAsset(res.assets[0]);
      setResult(null);
      setFeedbackSent(false);
    }
  };

  const takePhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Necesitamos permiso para usar la cámara.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.7
    });
    if (!res.canceled && res.assets?.length) {
      setSelectedAsset(res.assets[0]);
      setResult(null);
      setFeedbackSent(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedAsset) return;
    setAnalyzing(true);
    setError(null);
    setLimitReached(false);

    try {
      const response = await recognitionApi.recognizeAutoImage(selectedAsset);
      setResult(response);
      if (isGuest && response?.guest) {
        await refreshGuestStatus(response.guest);
      }
    } catch (err) {
      if (err.code === 'GUEST_LIMIT_REACHED' || err.status === 403) {
        setLimitReached(true);
      }
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!result?.analysis?.id) return;
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      await feedbackApi.create(result.analysis.id, isCorrect, comment.trim() || undefined);
      setFeedbackSent(true);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const recognizedRockId = result?.rock?.id || result?.analysis?.rockId || result?.collection?.rockId;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isGuest && (
        <View style={styles.guestCounterCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.guestTitle}>Modo Invitado</Text>
            <Text style={styles.guestSub}>
              Te quedan {guestInfo?.remaining ?? 10} de {guestInfo?.limit ?? 10} reconocimientos gratuitos.
            </Text>
          </View>
          <AppButton
            title="Guardar progreso"
            variant="secondary"
            onPress={() => navigation.navigate('GuestUpgrade')}
            style={{ paddingVertical: 8, paddingHorizontal: 12, minHeight: 40 }}
          />
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.title}>Identificar Roca por Imagen</Text>
        <Text style={styles.subtitle}>
          Toma una fotografía clara de la roca o selecciona una imagen desde tu dispositivo.
        </Text>

        <View style={styles.buttonRow}>
          <AppButton title="Usar Cámara" onPress={takePhoto} style={styles.halfBtn} />
          <AppButton title="Abrir Galería" variant="outline" onPress={pickFromGallery} style={styles.halfBtn} />
        </View>

        {selectedAsset && (
          <View style={styles.previewBox}>
            <Image source={{ uri: selectedAsset.uri }} style={styles.previewImage} />
            <View style={styles.previewActions}>
              <AppButton
                title="Analizar Roca con IA"
                loading={analyzing}
                onPress={handleAnalyze}
                style={{ marginBottom: SPACING.sm }}
              />
              <AppButton
                title="Cambiar imagen"
                variant="outline"
                disabled={analyzing}
                onPress={() => {
                  setSelectedAsset(null);
                  setResult(null);
                }}
              />
            </View>
          </View>
        )}
      </View>

      {error && (
        <View style={{ marginTop: SPACING.md }}>
          <ErrorState message={error} />
          {limitReached && (
            <AppButton
              title="Crear Cuenta y Transferir Mi Colección"
              variant="secondary"
              onPress={() => navigation.navigate('GuestUpgrade')}
            />
          )}
        </View>
      )}

      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: result.newDiscovery
                    ? COLORS.successBg || '#D4EDDA'
                    : '#E2ECE9'
                }
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  { color: result.newDiscovery ? COLORS.success : COLORS.primary }
                ]}
              >
                {result.newDiscovery ? '¡NUEVO DESCUBRIMIENTO!' : 'YA EN TU COLECCIÓN'}
              </Text>
            </View>
            <Text style={styles.confidence}>
              Confianza: {Number(result.analysis?.confidence || 0).toFixed(0)}%
            </Text>
          </View>

          <Text style={styles.rockName}>{result.rock?.name || result.analysis?.result}</Text>
          {result.rock?.scientificName ? (
            <Text style={styles.scientificName}>{result.rock.scientificName}</Text>
          ) : null}
          {result.rock?.description ? (
            <Text style={styles.rockDesc}>{result.rock.description}</Text>
          ) : null}

          {result.unlockedAchievements?.length > 0 && (
            <View style={styles.achievementBanner}>
              <Text style={styles.achTitle}>¡Logros Desbloqueados!</Text>
              {result.unlockedAchievements.map((ach) => (
                <Text key={ach.id} style={styles.achItem}>
                  • {ach.name}
                </Text>
              ))}
            </View>
          )}

          {recognizedRockId ? (
            <AppButton
              title="Ver Ficha Geológica de la Roca"
              onPress={() =>
                navigation.navigate('RockDetail', {
                  rockId: recognizedRockId,
                  initialRock: result.rock
                })
              }
              style={{ marginTop: SPACING.md }}
            />
          ) : null}

          <AppButton
            title="Ver en el Catálogo"
            variant="outline"
            onPress={() => navigation.navigate('CatalogList')}
            style={{ marginTop: SPACING.sm }}
          />

          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>¿Fue acertado este diagnóstico?</Text>
            {feedbackSent ? (
              <Text style={styles.feedbackSuccess}>
                ¡Gracias! Tu evaluación fue registrada para este análisis.
              </Text>
            ) : (
              <>
                {feedbackError ? <ErrorState message={feedbackError} /> : null}
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>
                    {isCorrect ? 'Sí, la identificación es correcta' : 'No, la identificación falló'}
                  </Text>
                  <Switch
                    value={isCorrect}
                    onValueChange={setIsCorrect}
                    trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                    thumbColor={isCorrect ? COLORS.primary : '#f4f3f4'}
                  />
                </View>
                <FormField
                  label="Comentario opcional"
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Ej. Excelente precisión"
                />
                <AppButton
                  title="Enviar Feedback"
                  variant="secondary"
                  loading={feedbackLoading}
                  onPress={handleSendFeedback}
                />
              </>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  guestCounterCard: {
    backgroundColor: COLORS.guestBg,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C5D5EA'
  },
  guestTitle: { fontSize: 14, fontWeight: '800', color: COLORS.guestBadge },
  guestSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, paddingRight: 8 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border
  },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.md },
  buttonRow: { flexDirection: 'row', gap: SPACING.sm },
  halfBtn: { flex: 1 },
  previewBox: { marginTop: SPACING.lg },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#E1E4E8',
    marginBottom: SPACING.md
  },
  previewActions: { marginTop: SPACING.xs },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800'
  },
  confidence: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  rockName: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  scientificName: { fontSize: 14, fontStyle: 'italic', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  rockDesc: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  achievementBanner: {
    backgroundColor: COLORS.warningBg,
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#F3D9B1'
  },
  achTitle: { fontSize: 14, fontWeight: '800', color: COLORS.warning, marginBottom: 4 },
  achItem: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  feedbackSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  feedbackTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm },
  feedbackSuccess: { fontSize: 14, fontWeight: '700', color: COLORS.success, paddingVertical: SPACING.sm },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  switchLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text }
});