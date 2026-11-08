import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { recognitionApi, feedbackApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
  AppButton,
  FormField,
  ErrorState,
  GuestBanner
} from '../../components/UI';
import { COLORS, SPACING } from '../../theme/theme';

export default function RecognitionScreen({ navigation }) {
  const { isGuest, isAuthenticated, guestInfo, refreshGuestStatus } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [result, setResult] = useState(null);

  // Estado de Retroalimentación (Feedback guardado en SQLite del backend)
  const [fbIsCorrect, setFbIsCorrect] = useState(null);
  const [fbComment, setFbComment] = useState('');
  const [fbSaved, setFbSaved] = useState(null);
  const [fbError, setFbError] = useState(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbSuccessMsg, setFbSuccessMsg] = useState('');

  const resetFeedbackState = () => {
    setFbIsCorrect(null);
    setFbComment('');
    setFbSaved(null);
    setFbError(null);
    setFbSuccessMsg('');
  };

  const handlePickGallery = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Se requiere permiso para acceder a la galería de imágenes.');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85
    });
    if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
      setSelectedImage(pickerResult.assets[0]);
      setResult(null);
      resetFeedbackState();
    }
  };

  const handleTakePhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Se requiere permiso para utilizar la cámara del dispositivo.');
      return;
    }
    const cameraResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85
    });
    if (!cameraResult.canceled && cameraResult.assets?.length > 0) {
      setSelectedImage(cameraResult.assets[0]);
      setResult(null);
      resetFeedbackState();
    }
  };

  const handleSendImageToAI = async () => {
    if (!selectedImage) {
      setError('Primero selecciona o captura una fotografía de la roca.');
      return;
    }
    setProcessing(true);
    setError(null);
    setLimitReached(false);
    resetFeedbackState();

    try {
      const res = await recognitionApi.recognizeAutoImage(selectedImage);
      setResult(res);
      if (res.guest) await refreshGuestStatus(res.guest);
      else if (isGuest) await refreshGuestStatus();
    } catch (err) {
      if (err.code === 'GUEST_LIMIT_REACHED' || err.status === 403) {
        setLimitReached(true);
        await refreshGuestStatus();
      }
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitFeedback = async () => {
    setFbError(null);
    setFbSuccessMsg('');

    if (typeof fbIsCorrect !== 'boolean') {
      setFbError('Debes indicar si la identificación fue Correcta o Incorrecta.');
      return;
    }
    if (fbComment.length > 255) {
      setFbError('El comentario no puede superar los 255 caracteres.');
      return;
    }

    const analysisId = result?.analysis?.id;
    if (!analysisId) return;

    setFbLoading(true);
    try {
      if (!fbSaved) {
        const created = await feedbackApi.create(analysisId, fbIsCorrect, fbComment.trim());
        setFbSaved(created);
        setFbSuccessMsg('¡Retroalimentación guardada en el servidor para revisión del Administrador!');
      } else {
        const updated = await feedbackApi.update(analysisId, {
          isCorrect: fbIsCorrect,
          comment: fbComment.trim()
        });
        setFbSaved(updated);
        setFbSuccessMsg('¡Retroalimentación actualizada en el servidor!');
      }
    } catch (err) {
      setFbError(err.message);
    } finally {
      setFbLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
      {isGuest ? (
        <GuestBanner
          guestInfo={guestInfo}
          onUpgradePress={() => navigation.navigate('GuestUpgrade')}
        />
      ) : null}

      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          Identificación de Roca por Imagen
        </Text>
        <Text style={styles.subtitle}>
          Toma una fotografía o elige una imagen desde tu dispositivo. El archivo se enviará al backend (`POST /api/recognition/auto`) para su clasificación con el modelo GeoDex.
        </Text>

        <View style={styles.buttonRow}>
          <AppButton
            title="📷 Capturar con Cámara"
            onPress={handleTakePhoto}
            style={{ flex: 1, marginRight: SPACING.xs }}
          />
          <AppButton
            title="🖼️ Subir desde Galería"
            variant="secondary"
            onPress={handlePickGallery}
            style={{ flex: 1, marginLeft: SPACING.xs }}
          />
        </View>

        {selectedImage ? (
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>Previsualización de la imagen seleccionada:</Text>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            <AppButton
              title="Analizar Imagen con IA"
              loading={processing}
              onPress={handleSendImageToAI}
              style={{ marginTop: SPACING.sm }}
            />
            <AppButton
              title="Cambiar o descartar imagen"
              variant="outline"
              onPress={() => {
                setSelectedImage(null);
                setResult(null);
                setError(null);
              }}
              style={{ marginTop: SPACING.xs }}
            />
          </View>
        ) : (
          <View style={styles.emptyPreview}>
            <Text style={styles.emptyPreviewText}>
              Aún no has cargado ninguna imagen. Selecciona una foto arriba para previsualizarla y enviarla al clasificador.
            </Text>
          </View>
        )}
      </View>

      {limitReached ? (
        <View style={styles.limitCard} accessibilityRole="alert">
          <Text style={styles.limitTitle}>⛔ Alcanzaste el límite de 10 reconocimientos</Text>
          <Text style={styles.limitDesc}>
            Tu sesión temporal de invitado ha llegado al máximo permitido. Crea una cuenta o inicia sesión para conservar tus descubrimientos y continuar sin límite.
          </Text>
          <AppButton
            title="Crear cuenta y conservar mi progreso"
            onPress={() => navigation.navigate('GuestUpgrade')}
            style={{ marginTop: SPACING.sm }}
          />
        </View>
      ) : null}

      {error && !limitReached ? (
        <ErrorState message={error} onRetry={handleSendImageToAI} />
      ) : null}

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultBadge}>
            {result.newDiscovery ? '🌟 ¡NUEVO DESCUBRIMIENTO PARA TU COLECCIÓN!' : '✅ ROCA IDENTIFICADA'}
          </Text>
          <Text style={styles.resultTitle}>{result.analysis?.result}</Text>
          <Text style={styles.resultConfidence}>
            Confianza entregada por el modelo IA: {result.analysis?.confidence}%
          </Text>
          <Text style={styles.resultMeta}>
            Veces que has reconocido esta roca: {result.collection?.recognitionCount}
          </Text>

          {result.unlockedAchievements?.length > 0 ? (
            <View style={styles.achBox}>
              <Text style={styles.achTitle}>🏆 ¡Logro(s) desbloqueado(s)!</Text>
              {result.unlockedAchievements.map((ach) => (
                <Text key={ach.id} style={styles.achItem}>
                  • {ach.name} (+{ach.experience} EXP)
                </Text>
              ))}
            </View>
          ) : null}

          <AppButton
            title="Ver Ficha Geológica en el Catálogo"
            variant="outline"
            onPress={() =>
              navigation.navigate('CatalogTab', {
                screen: 'RockDetail',
                params: { rockId: result.analysis?.rockId }
              })
            }
            style={{ marginTop: SPACING.sm }}
          />

          {isAuthenticated ? (
            <View style={styles.feedbackSection}>
              <Text style={styles.sectionTitle}>
                {fbSaved ? 'Editar mi evaluación del reconocimiento' : 'Evaluar precisión de la IA'}
              </Text>
              <Text style={styles.subtitle}>
                Tu evaluación se almacena en la base de datos del sistema para que el Administrador supervise el desempeño del modelo.
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => setFbIsCorrect(true)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: fbIsCorrect === true }}
                  style={[
                    styles.voteBtn,
                    fbIsCorrect === true && styles.voteBtnCorrect
                  ]}
                >
                  <Text
                    style={[
                      styles.voteText,
                      fbIsCorrect === true && styles.voteTextActive
                    ]}
                  >
                    👍 Sí, es correcto
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFbIsCorrect(false)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: fbIsCorrect === false }}
                  style={[
                    styles.voteBtn,
                    fbIsCorrect === false && styles.voteBtnWrong
                  ]}
                >
                  <Text
                    style={[
                      styles.voteText,
                      fbIsCorrect === false && styles.voteTextActive
                    ]}
                  >
                    👎 No, es incorrecto
                  </Text>
                </TouchableOpacity>
              </View>

              <FormField
                label={`Comentario adicional (${fbComment.length}/255 caracteres)`}
                value={fbComment}
                onChangeText={setFbComment}
                placeholder="Opcional: describe por qué consideras acertada o errónea la clasificación..."
                multiline
              />

              {fbError ? <Text style={styles.fbError}>⚠ {fbError}</Text> : null}
              {fbSuccessMsg ? <Text style={styles.fbSuccess}>✔ {fbSuccessMsg}</Text> : null}

              <AppButton
                title={fbSaved ? 'Actualizar Retroalimentación' : 'Enviar Retroalimentación'}
                loading={fbLoading}
                onPress={handleSubmitFeedback}
              />
            </View>
          ) : (
            <Text style={styles.guestFeedbackNotice}>
              ℹ️ Inicia sesión con una cuenta para evaluar la respuesta de la IA.
            </Text>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  previewBox: { marginTop: SPACING.sm },
  previewLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt
  },
  emptyPreview: {
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    marginTop: SPACING.xs
  },
  emptyPreviewText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  limitCard: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.dangerBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.danger
  },
  limitTitle: { fontSize: 17, fontWeight: '800', color: COLORS.danger, marginBottom: 4 },
  limitDesc: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  resultCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary
  },
  resultBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.success,
    marginBottom: 4
  },
  resultTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  resultConfidence: { fontSize: 15, fontWeight: '600', color: COLORS.primary, marginTop: 4 },
  resultMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  achBox: {
    backgroundColor: COLORS.warningBg,
    padding: SPACING.sm,
    borderRadius: 10,
    marginTop: SPACING.sm
  },
  achTitle: { fontSize: 14, fontWeight: '700', color: COLORS.warning },
  achItem: { fontSize: 13, color: COLORS.text, marginTop: 2 },
  feedbackSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  voteBtn: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    backgroundColor: COLORS.background
  },
  voteBtnCorrect: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  voteBtnWrong: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  voteText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  voteTextActive: { color: '#FFFFFF' },
  fbError: { color: COLORS.danger, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  fbSuccess: { color: COLORS.success, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  guestFeedbackNotice: {
    marginTop: SPACING.md,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic'
  }
});