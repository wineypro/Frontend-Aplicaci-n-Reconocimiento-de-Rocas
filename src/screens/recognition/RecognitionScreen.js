import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { recognitionApi, feedbackApi } from '../../api/services';
import { AppButton, Badge, ErrorState, FormField } from '../../components/UI';
import { COLORS, SPACING } from '../../theme/theme';

export default function RecognitionScreen({ navigation }) {
  const { isGuest, guestInfo, refreshGuestStatus } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [limitReached, setLimitReached] = useState(false);

  const [rating, setRating] = useState('5');
  const [comments, setComments] = useState('');
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
      quality: 0.8
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
      quality: 0.8
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
      const response = await recognitionApi.recognizeImage(selectedAsset);
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
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      setFeedbackError('La calificación debe ser un número entero entre 1 y 5.');
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      await feedbackApi.create({
        analysisId: result.analysis.id,
        rating: numericRating,
        comments: comments.trim() || undefined
      });
      setFeedbackSent(true);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

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
            <Badge
              label={result.newDiscovery ? '¡NUEVO DESCUBRIMIENTO!' : 'YA EN TU COLECCIÓN'}
              color={result.newDiscovery ? COLORS.success : COLORS.primary}
              bg={result.newDiscovery ? COLORS.successBg : '#E2ECE9'}
            />
            <Text style={styles.confidence}>
              Confianza: {Number(result.analysis?.confidence || 0).toFixed(1)}%
            </Text>
          </View>

          <Text style={styles.rockName}>{result.rock?.name}</Text>
          <Text style={styles.scientificName}>{result.rock?.scientificName}</Text>
          <Text style={styles.rockDesc}>{result.rock?.description}</Text>

          {result.unlockedAchievements?.length > 0 && (
            <View style={styles.achievementBanner}>
              <Text style={styles.achTitle}>¡Logros Desbloqueados!</Text>
              {result.unlockedAchievements.map((ach) => (
                <Text key={ach.id} style={styles.achItem}>
                  • {ach.name} (+{ach.experience} XP)
                </Text>
              ))}
            </View>
          )}

          {/* BOTONES REPARADOS PARA EL NUEVO NAVEGADOR */}
          <AppButton
            title="Ver Ficha Técnica de la Roca"
            onPress={() =>
              navigation.navigate('RockDetail', {
                rockId: result.rock.id,
                initialRock: result.rock
              })
            }
            style={{ marginTop: SPACING.md }}
          />

          <AppButton
            title="Ir al Catálogo de Bloques"
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
                <FormField
                  label="Calificación (1 a 5 estrellas)"
                  value={rating}
                  onChangeText={setRating}
                  keyboardType="numeric"
                  placeholder="5"
                />
                <FormField
                  label="Comentario opcional"
                  value={comments}
                  onChangeText={setComments}
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
  feedbackSuccess: { fontSize: 14, fontWeight: '700', color: COLORS.success, paddingVertical: SPACING.sm }
});