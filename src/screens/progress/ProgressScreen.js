import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { progressApi, feedbackApi, authApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
  LoadingState,
  ErrorState,
  AppButton,
  FormField,
  GuestBanner
} from '../../components/UI';
import { COLORS, SPACING } from '../../theme/theme';

export default function ProgressScreen({ navigation }) {
  const { isAuthenticated, isGuest, user, setUser, guestInfo, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para consultar/editar Feedback desde el historial
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [existingFb, setExistingFb] = useState(null);
  const [fbIsCorrect, setFbIsCorrect] = useState(null);
  const [fbComment, setFbComment] = useState('');
  const [fbStatusMsg, setFbStatusMsg] = useState('');
  const [fbSaving, setFbSaving] = useState(false);

  // Estado para editar perfil propio
  const [editingProfile, setEditingProfile] = useState(false);
  const [newUserName, setNewUserName] = useState(user?.userName || '');
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, histRes] = await Promise.all([
        progressApi.getStats(),
        progressApi.getHistory({ limit: 15 })
      ]);
      setStats(statsRes);
      setHistory(histRes?.items || []);

      if (isAuthenticated) {
        const achRes = await progressApi.getMyAchievements();
        setAchievements(Array.isArray(achRes) ? achRes : []);
      } else {
        const publicAch = await progressApi.listAllAchievements();
        const items = publicAch?.items || [];
        const distinct = statsRes?.distinctRocks || 0;
        const totalRec = statsRes?.totalRecognitions || 0;
        setAchievements(
          items.map((a) => {
            const unlocked =
              (a.conditionType === 'distinct_rocks' && distinct >= a.conditionValue) ||
              (a.conditionType === 'total_recognitions' && totalRec >= a.conditionValue);
            return { ...a, unlocked, unlockedAt: null };
          })
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const openFeedbackModal = async (analysisItem) => {
    setActiveAnalysis(analysisItem);
    setExistingFb(null);
    setFbIsCorrect(null);
    setFbComment('');
    setFbStatusMsg('');
    try {
      const fb = await feedbackApi.get(analysisItem.id);
      setExistingFb(fb);
      setFbIsCorrect(fb.isCorrect);
      setFbComment(fb.comment || '');
    } catch {
      // 404 significa que aún no tiene feedback creado
    }
  };

  const saveFeedbackModal = async () => {
    if (typeof fbIsCorrect !== 'boolean') {
      setFbStatusMsg('⚠ Selecciona si el reconocimiento fue Correcto o Incorrecto.');
      return;
    }
    if (fbComment.length > 255) {
      setFbStatusMsg('⚠ El comentario no debe superar 255 caracteres.');
      return;
    }
    setFbSaving(true);
    setFbStatusMsg('');
    try {
      if (existingFb) {
        const updated = await feedbackApi.update(activeAnalysis.id, {
          isCorrect: fbIsCorrect,
          comment: fbComment.trim()
        });
        setExistingFb(updated);
        setFbStatusMsg('✔ Retroalimentación actualizada.');
      } else {
        const created = await feedbackApi.create(
          activeAnalysis.id,
          fbIsCorrect,
          fbComment.trim()
        );
        setExistingFb(created);
        setFbStatusMsg('✔ Retroalimentación guardada.');
      }
    } catch (err) {
      setFbStatusMsg(`⚠ ${err.message}`);
    } finally {
      setFbSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileMsg('');
    if (!newUserName.trim()) {
      setProfileMsg('⚠ El nombre de usuario no puede estar vacío.');
      return;
    }
    try {
      const updated = await authApi.updateProfile({
        userName: newUserName.trim(),
        phone: newPhone.trim() || undefined
      });
      setUser((prev) => ({ ...prev, ...updated }));
      setProfileMsg('✔ Perfil actualizado correctamente.');
      setEditingProfile(false);
    } catch (err) {
      setProfileMsg(`⚠ ${err.message}`);
    }
  };

  if (loading) return <LoadingState message="Calculando estadísticas y logros..." />;
  if (error) return <ErrorState message={error} onRetry={loadAll} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
      {isGuest ? (
        <GuestBanner
          guestInfo={guestInfo}
          onUpgradePress={() => navigation.navigate('GuestUpgrade')}
        />
      ) : null}

      {/* Tarjeta de Usuario / Sesión */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.roleBadge}>
              {isGuest
                ? 'SESIÓN TEMPORAL DE INVITADO'
                : `CUENTA: ${user?.role?.name?.toUpperCase() || 'AUTENTICADO'}`}
            </Text>
            <Text style={styles.userName}>
              {isGuest ? 'Explorador Invitado' : user?.userName}
            </Text>
            {!isGuest && user?.email ? (
              <Text style={styles.userEmail}>{user.email}</Text>
            ) : null}
          </View>
          <AppButton
            title={isGuest ? 'Salir de invitado' : 'Cerrar Sesión'}
            variant="danger"
            onPress={logout}
          />
        </View>

        {isAuthenticated ? (
          <View style={{ marginTop: SPACING.sm }}>
            {editingProfile ? (
              <View style={styles.editBox}>
                <FormField
                  label="Nombre de usuario"
                  value={newUserName}
                  onChangeText={setNewUserName}
                />
                <FormField
                  label="Teléfono"
                  value={newPhone}
                  onChangeText={setNewPhone}
                  placeholder="+56 9..."
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <AppButton
                    title="Guardar"
                    onPress={handleSaveProfile}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <AppButton
                    title="Cancelar"
                    variant="outline"
                    onPress={() => setEditingProfile(false)}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              <AppButton
                title="Editar mi perfil"
                variant="outline"
                onPress={() => {
                  setNewUserName(user?.userName || '');
                  setNewPhone(user?.phone || '');
                  setEditingProfile(true);
                }}
              />
            )}
            {profileMsg ? <Text style={styles.profileMsg}>{profileMsg}</Text> : null}
          </View>
        ) : null}
      </View>

      {/* Indicadores de Progreso */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          {isGuest ? 'Progreso de Sesión Temporal' : 'Estadísticas y Rango Geológico'}
        </Text>
        <Text style={styles.rankBadge}>🎖️ Rango actual: {stats?.rank || 'Piedra Rodante'}</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{stats?.totalRecognitions ?? 0}</Text>
            <Text style={styles.metricLabel}>Reconocimientos</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{stats?.distinctRocks ?? 0}</Text>
            <Text style={styles.metricLabel}>Rocas Distintas</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{stats?.unlockedAchievements ?? 0}</Text>
            <Text style={styles.metricLabel}>Logros Obtenidos</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{stats?.discoveryPercentage ?? 0}%</Text>
            <Text style={styles.metricLabel}>% del Catálogo</Text>
          </View>
        </View>

        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(stats?.discoveryPercentage || 0, 100)}%` }
            ]}
          />
        </View>
      </View>

      {/* Logros Desbloqueados y Bloqueados */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Logros y Recompensas</Text>
        <Text style={styles.subtitle}>
          Los logros se distinguen mediante íconos y estado textual accesible.
        </Text>

        {achievements.map((ach) => (
          <View
            key={ach.id}
            style={[styles.achCard, ach.unlocked ? styles.achUnlocked : styles.achLocked]}
            accessibilityLabel={`Logro ${ach.name}, estado: ${
              ach.unlocked ? 'Desbloqueado' : 'Pendiente'
            }. ${ach.description}`}
          >
            <View style={styles.achHeader}>
              <Text style={styles.achStatusBadge}>
                {ach.unlocked ? '🏆 DESBLOQUEADO' : '🔒 BLOQUEADO'}
              </Text>
              <Text style={styles.achExp}>+{ach.experience} EXP</Text>
            </View>
            <Text style={styles.achName}>{ach.name}</Text>
            <Text style={styles.achDesc}>{ach.description}</Text>
            {ach.unlocked && ach.unlockedAt ? (
              <Text style={styles.achDate}>
                Obtenido el: {new Date(ach.unlockedAt).toLocaleDateString('es-CL')}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* Historial de Actividad */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Historial Reciente de Actividad</Text>
        {history.length === 0 ? (
          <Text style={styles.subtitle}>Aún no se registran análisis en esta sesión.</Text>
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.histRock}>{item.result || item.rock?.name}</Text>
                <Text style={styles.histMeta}>
                  Confianza: {item.confidence}% ·{' '}
                  {new Date(item.createdAt).toLocaleDateString('es-CL')}
                </Text>
              </View>
              {isAuthenticated ? (
                <TouchableOpacity
                  onPress={() => openFeedbackModal(item)}
                  style={styles.fbBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Calificar o editar feedback del análisis ${item.id}`}
                >
                  <Text style={styles.fbBtnText}>💬 Feedback</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}
      </View>

      {/* Modal para consultar/modificar Feedback desde el Historial */}
      <Modal
        visible={Boolean(activeAnalysis)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveAnalysis(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>
              Retroalimentación de: {activeAnalysis?.result}
            </Text>
            <Text style={styles.subtitle}>
              {existingFb
                ? 'Ya evaluaste este reconocimiento. Puedes actualizar tu calificación:'
                : 'Indica si la identificación fue correcta o incorrecta:'}
            </Text>

            <View style={{ flexDirection: 'row', marginBottom: SPACING.sm }}>
              <TouchableOpacity
                onPress={() => setFbIsCorrect(true)}
                style={[styles.voteBtn, fbIsCorrect === true && styles.voteCorrect]}
              >
                <Text style={[styles.voteText, fbIsCorrect === true && { color: '#FFF' }]}>
                  👍 Correcto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFbIsCorrect(false)}
                style={[styles.voteBtn, fbIsCorrect === false && styles.voteWrong]}
              >
                <Text style={[styles.voteText, fbIsCorrect === false && { color: '#FFF' }]}>
                  👎 Incorrecto
                </Text>
              </TouchableOpacity>
            </View>

            <FormField
              label={`Comentario (${fbComment.length}/255)`}
              value={fbComment}
              onChangeText={setFbComment}
              placeholder="Observaciones opcionales..."
              multiline
            />

            {fbStatusMsg ? <Text style={styles.profileMsg}>{fbStatusMsg}</Text> : null}

            <View style={{ flexDirection: 'row', marginTop: SPACING.xs }}>
              <AppButton
                title="Cerrar"
                variant="outline"
                onPress={() => setActiveAnalysis(null)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <AppButton
                title={existingFb ? 'Actualizar' : 'Guardar'}
                loading={fbSaving}
                onPress={saveFeedbackModal}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roleBadge: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  userName: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  userEmail: { fontSize: 13, color: COLORS.textSecondary },
  editBox: { marginTop: SPACING.sm },
  profileMsg: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 6 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  rankBadge: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: SPACING.sm
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricBox: {
    width: '48%',
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: 10,
    marginBottom: SPACING.sm,
    alignItems: 'center'
  },
  metricVal: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  metricLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  progressBarBg: {
    height: 12,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 6,
    overflow: 'hidden'
  },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary },
  achCard: {
    padding: SPACING.sm,
    borderRadius: 10,
    marginBottom: SPACING.sm,
    borderWidth: 1.5
  },
  achUnlocked: { backgroundColor: COLORS.successBg, borderColor: COLORS.success },
  achLocked: { backgroundColor: COLORS.background, borderColor: COLORS.border },
  achHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  achStatusBadge: { fontSize: 11, fontWeight: '800', color: COLORS.text },
  achExp: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  achName: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  achDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  achDate: { fontSize: 11, color: COLORS.success, fontWeight: '700', marginTop: 4 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt
  },
  histRock: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  histMeta: { fontSize: 12, color: COLORS.textSecondary },
  fbBtn: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  fbBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: SPACING.lg
  },
  modalCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: SPACING.lg },
  voteBtn: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4
  },
  voteCorrect: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  voteWrong: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  voteText: { fontWeight: '700', color: COLORS.text }
});