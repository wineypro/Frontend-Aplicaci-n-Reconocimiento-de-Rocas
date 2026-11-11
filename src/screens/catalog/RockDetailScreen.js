import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { catalogApi, progressApi, adminApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { LoadingState, ErrorState, AppButton, FormField } from '../../components/UI';
import { getRockImageSource } from '../../utils/rockImages';
import { COLORS, SPACING } from '../../theme/theme';

export default function RockDetailScreen({ route, navigation }) {
  const { rockId, initialRock } = route.params || {};
  const { user, isAdmin } = useAuth();
  const [rock, setRock] = useState(initialRock || null);
  const [capturedSamples, setCapturedSamples] = useState([]);
  const [loading, setLoading] = useState(!initialRock);
  const [error, setError] = useState(null);

  // Estado exclusivo para edición docente (Maestro / Admin)
  const isTeacher =
    user?.roleId === 2 ||
    String(user?.role?.name || '').toLowerCase() === 'teacher' ||
    String(user?.role?.name || '').toLowerCase() === 'maestro';
  const canEditPedagogicalInfo = isTeacher || isAdmin;

  const [editingNote, setEditingNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [teacherMsg, setTeacherMsg] = useState('');
  const [teacherForm, setTeacherForm] = useState({
    description: '',
    composition: '',
    environment: '',
    commonUses: ''
  });

  const fetchDetailAndSamples = useCallback(async () => {
    if (!rockId) return;
    setLoading(true);
    setError(null);
    try {
      const [data, historyRes] = await Promise.all([
        catalogApi.getRock(rockId),
        progressApi.getHistory({ limit: 100 }).catch(() => ({ items: [] }))
      ]);
      setRock(data);
      setTeacherForm({
        description: data?.description || '',
        composition: data?.composition || '',
        environment: data?.environment || '',
        commonUses: data?.commonUses || ''
      });

      // Filtrar todas las capturas fotográficas que el usuario ha hecho de esta misma roca
      const allHistory = historyRes?.items || [];
      const matchingPhotos = allHistory.filter(
        (h) =>
          Number(h.rockId) === Number(rockId) &&
          typeof h.imageUrl === 'string' &&
          (h.imageUrl.startsWith('data:image/') || h.imageUrl.startsWith('http'))
      );

      // Si la roca tiene una foto en imgUrl que aún no estaba en el listado de Analysis, incluirla también
      if (
        typeof data?.imgUrl === 'string' &&
        data.imgUrl.startsWith('data:image/') &&
        !matchingPhotos.some((p) => p.imageUrl === data.imgUrl)
      ) {
        matchingPhotos.unshift({
          id: 'main-img',
          imageUrl: data.imgUrl,
          confidence: 100,
          createdAt: data.updatedAt || data.createdAt
        });
      }

      setCapturedSamples(matchingPhotos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [rockId]);

  useEffect(() => {
    fetchDetailAndSamples();
  }, [fetchDetailAndSamples]);

  const handleSaveTeacherEdit = async () => {
    if (!rock) return;
    setSavingNote(true);
    setTeacherMsg('');
    try {
      const updated = await adminApi.updateRock(rock.id, {
        description: teacherForm.description.trim() || rock.description,
        composition: teacherForm.composition.trim() || rock.composition,
        environment: teacherForm.environment.trim() || rock.environment,
        commonUses: teacherForm.commonUses.trim() || rock.commonUses
      });
      setRock(updated || { ...rock, ...teacherForm });
      setEditingNote(false);
      setTeacherMsg('Ficha pedagógica actualizada correctamente.');
    } catch (err) {
      setTeacherMsg(`Error: ${err.message}`);
    } finally {
      setSavingNote(false);
    }
  };

  if (loading && !rock) return <LoadingState message="Cargando ficha geológica..." />;
  if (error && !rock) return <ErrorState message={error} onRetry={fetchDetailAndSamples} />;
  if (!rock) return <ErrorState message="Roca no encontrada" />;

  const isLockedByFusion = rock.composition === 'LOCKED_BY_FUSION';
  const imgSource = getRockImageSource(rock);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={[styles.blockPreviewBox, !imgSource && styles.fusionSymbolBox]}>
            {imgSource ? (
              <Image source={imgSource} style={styles.blockPreview} />
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Feather
                  name={isLockedByFusion ? 'zap' : 'layers'}
                  size={34}
                  color={isLockedByFusion ? COLORS.warning : COLORS.primary}
                />
                <Text style={styles.symbolSubText}>
                  {isLockedByFusion ? 'FUSIÓN' : 'ROCA'}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <View
              style={[
                styles.tagPill,
                { backgroundColor: COLORS.warningBg || '#FFF3CD' }
              ]}
            >
              <Text
                style={[
                  styles.tagPillText,
                  { color: isLockedByFusion ? COLORS.warning : COLORS.secondary }
                ]}
              >
                {isLockedByFusion ? 'DESCUBIERTA POR FUSIÓN' : `ESPÉCIMEN #${rock.index}`}
              </Text>
            </View>
            <Text style={styles.title}>{rock.name}</Text>
            <Text style={styles.scientific}>{rock.scientificName}</Text>
          </View>
        </View>
        <Text style={styles.description}>{rock.description}</Text>

        {/* Galería con todas las muestras iguales acumuladas por el usuario */}
        {capturedSamples.length > 0 && (
          <View style={styles.capturedBox}>
            <Text style={styles.capturedLabel}>
              Tus muestras fotografiadas de {rock.name} ({capturedSamples.length}):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              {capturedSamples.map((sample, idx) => (
                <View key={sample.id || idx} style={styles.sampleCard}>
                  <Image source={{ uri: sample.imageUrl }} style={styles.samplePhoto} />
                  <Text style={styles.sampleCaption}>
                    Muestra #{idx + 1}
                    {sample.confidence ? ` · ${Math.round(sample.confidence)}%` : ''}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {isLockedByFusion ? (
        <View style={styles.lockedCard}>
          <Feather name="lock" size={40} color={COLORS.warning} style={{ marginBottom: SPACING.sm }} />
          <Text style={styles.lockedTitle}>Información Geológica Bloqueada</Text>
          <Text style={styles.lockedText}>
            Esta roca la descubriste por fusión. ¡Encuéntrala y tómale una foto en la sección "Reconocer" para desbloquear toda su información geológica!
          </Text>
          <AppButton
            title="Ir a Escanear por Foto"
            onPress={() => navigation.navigate('Recognition')}
            style={{ marginTop: SPACING.md, alignSelf: 'stretch' }}
          />
        </View>
      ) : (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Propiedades Físicas y Geológicas</Text>

            <DetailRow label="Tipo de roca" value={rock.type?.name || 'No especificado'} />
            <DetailRow label="Categoría" value={rock.category?.name || 'General'} />
            <DetailRow label="Composición" value={rock.composition || 'No especificada'} />
            <DetailRow label="Fórmula química" value={rock.formula || rock.chemicalFormula || 'No aplica (Roca)'} />
            <DetailRow label="Ambiente de formación" value={rock.environment || rock.formationEnvironment || 'No especificado'} />
            <DetailRow label="Usos comunes" value={rock.commonUses || 'No especificado'} />
            <DetailRow label="Dureza (Escala de Mohs)" value={`${rock.hardness ?? 'Variable'}`} />
            <DetailRow label="Color" value={rock.color || 'Variado'} />
            <DetailRow label="Raya (Streak)" value={rock.streak || 'No diagnóstica'} />
            <DetailRow label="Textura" value={rock.texture || 'No especificada'} />
            <DetailRow label="Densidad" value={rock.density ? `${rock.density} g/cm³` : '2.6 - 2.8 g/cm³'} />
          </View>

          {/* Privilegio exclusivo para el rol Maestro (Teacher) o Admin */}
          {canEditPedagogicalInfo && (
            <View style={styles.teacherCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Feather name="award" size={18} color={COLORS.secondary} style={{ marginRight: 6 }} />
                <Text style={styles.teacherTitle}>
                  Herramienta Docente ({isTeacher ? 'Rol Maestro' : 'Administrador'})
                </Text>
              </View>
              <Text style={styles.teacherSub}>
                Como docente puedes enriquecer y corregir la información pedagógica de esta ficha para los estudiantes.
              </Text>

              {teacherMsg ? <Text style={styles.teacherMsg}>{teacherMsg}</Text> : null}

              {!editingNote ? (
                <AppButton
                  title="Editar Ficha Pedagógica"
                  variant="secondary"
                  onPress={() => setEditingNote(true)}
                  style={{ marginTop: SPACING.sm }}
                />
              ) : (
                <View style={{ marginTop: SPACING.sm }}>
                  <FormField
                    label="Descripción pedagógica"
                    value={teacherForm.description}
                    onChangeText={(v) => setTeacherForm({ ...teacherForm, description: v })}
                  />
                  <FormField
                    label="Composición mineralógica"
                    value={teacherForm.composition}
                    onChangeText={(v) => setTeacherForm({ ...teacherForm, composition: v })}
                  />
                  <FormField
                    label="Ambiente de formación"
                    value={teacherForm.environment}
                    onChangeText={(v) => setTeacherForm({ ...teacherForm, environment: v })}
                  />
                  <FormField
                    label="Usos comunes e industriales"
                    value={teacherForm.commonUses}
                    onChangeText={(v) => setTeacherForm({ ...teacherForm, commonUses: v })}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <AppButton
                      title="Guardar Ficha"
                      loading={savingNote}
                      onPress={handleSaveTeacherEdit}
                      style={{ flex: 1 }}
                    />
                    <AppButton
                      title="Cancelar"
                      variant="outline"
                      onPress={() => setEditingNote(false)}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  blockPreviewBox: {
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border
  },
  fusionSymbolBox: {
    backgroundColor: COLORS.warningBg || '#FFF3CD',
    borderColor: COLORS.warning
  },
  symbolSubText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.secondary,
    marginTop: 2
  },
  blockPreview: { width: 68, height: 68, resizeMode: 'contain' },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '800'
  },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginTop: 2 },
  scientific: { fontSize: 15, fontStyle: 'italic', color: COLORS.textSecondary },
  description: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  capturedBox: { marginTop: SPACING.md },
  capturedLabel: { fontSize: 13, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  sampleCard: {
    marginRight: 10,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  samplePhoto: { width: 130, height: 110, borderRadius: 8, resizeMode: 'cover' },
  sampleCaption: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginTop: 4 },
  lockedCard: {
    backgroundColor: COLORS.warningBg || '#FFF3CD',
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.warning,
    alignItems: 'center'
  },
  lockedTitle: { fontSize: 18, fontWeight: '900', color: COLORS.secondary, textAlign: 'center' },
  lockedText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: SPACING.xs
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border
  },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: COLORS.primary, marginBottom: SPACING.md },
  detailRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background
  },
  detailLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase' },
  detailValue: { fontSize: 15, color: COLORS.text, marginTop: 2, fontWeight: '600' },
  teacherCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.secondary
  },
  teacherTitle: { fontSize: 16, fontWeight: '900', color: COLORS.secondary },
  teacherSub: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  teacherMsg: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 6 }
});