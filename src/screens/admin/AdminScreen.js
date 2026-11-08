import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { adminApi, catalogApi, progressApi } from '../../api/services';
import {
  LoadingState,
  ErrorState,
  AppButton,
  FormField,
  ConfirmModal
} from '../../components/UI';
import { COLORS, SPACING } from '../../theme/theme';

export default function AdminScreen() {
  const [tab, setTab] = useState('stats'); // 'stats' | 'users' | 'catalog' | 'achievements'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  // Datos cargados
  const [stats, setStats] = useState(null);
  const [recognitions, setRecognitions] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rocks, setRocks] = useState([]);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [achievements, setAchievements] = useState([]);

  // Inspección de colección/logros de un usuario
  const [inspectedUser, setInspectedUser] = useState(null);
  const [inspectedData, setInspectedData] = useState({ collection: [], achievements: [] });

  // Formularios de creación rápida (Catálogo y Logros)
  const [newTypeName, setNewTypeName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [rockForm, setRockForm] = useState({
    name: '',
    scientificName: '',
    index: '',
    hardness: '6',
    composition: 'Silicatos',
    environment: 'Continental'
  });
  const [achForm, setAchForm] = useState({
    name: '',
    slug: '',
    description: '',
    experience: '20'
  });

  // Modal de confirmación destructiva
  const [confirmState, setConfirmState] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const loadSectionData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'stats') {
        const [st, recs, fbs] = await Promise.all([
          adminApi.getStats(),
          adminApi.getRecognitions({ limit: 10 }),
          adminApi.getFeedback({ limit: 10 })
        ]);
        setStats(st);
        setRecognitions(recs?.items || []);
        setFeedbacks(fbs?.items || []);
      } else if (tab === 'users') {
        const [uRes, rRes] = await Promise.all([
          adminApi.listUsers({ limit: 50 }),
          adminApi.listRoles()
        ]);
        setUsers(uRes?.items || []);
        setRoles(rRes?.items || []);
      } else if (tab === 'catalog') {
        const [rkRes, tRes, cRes] = await Promise.all([
          catalogApi.listRocks({ limit: 50 }),
          catalogApi.listTypes(),
          catalogApi.listCategories()
        ]);
        setRocks(rkRes?.items || []);
        setTypes(tRes?.items || []);
        setCategories(cRes?.items || []);
      } else if (tab === 'achievements') {
        const aRes = await progressApi.listAllAchievements();
        setAchievements(aRes?.items || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadSectionData();
  }, [loadSectionData]);

  const askConfirm = (title, message, callback) => {
    setConfirmState({
      visible: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, visible: false }));
        await callback();
      }
    });
  };

  const handleToggleUserStatus = (u) => {
    const nextStatus = u.status === 'active' ? 'blocked' : 'active';
    askConfirm(
      `${nextStatus === 'blocked' ? 'Bloquear' : 'Activar'} cuenta de ${u.userName}`,
      `¿Confirmas cambiar el estado de "${u.email}" a "${nextStatus}"?`,
      async () => {
        try {
          await adminApi.updateUser(u.id, { status: nextStatus });
          setActionMsg(`✔ Estado de ${u.userName} actualizado a ${nextStatus}.`);
          loadSectionData();
        } catch (err) {
          setActionMsg(`⚠ ${err.message}`);
        }
      }
    );
  };

  const handleChangeUserRole = async (u, roleId) => {
    try {
      await adminApi.updateUser(u.id, { roleId: Number(roleId) });
      setActionMsg(`✔ Rol de ${u.userName} actualizado.`);
      loadSectionData();
    } catch (err) {
      setActionMsg(`⚠ ${err.message}`);
    }
  };

  const handleInspectUser = async (u) => {
    try {
      const [col, ach] = await Promise.all([
        adminApi.getUserCollection(u.id, { limit: 20 }),
        adminApi.getUserAchievements(u.id, { limit: 20 })
      ]);
      setInspectedUser(u);
      setInspectedData({
        collection: col?.items || [],
        achievements: ach?.items || []
      });
    } catch (err) {
      setActionMsg(`⚠ ${err.message}`);
    }
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;
    try {
      await adminApi.createType({ name: newTypeName.trim() });
      setNewTypeName('');
      setActionMsg('✔ Tipo de roca creado.');
      loadSectionData();
    } catch (err) {
      setActionMsg(`⚠ ${err.message}`);
    }
  };

  const handleDeleteType = (t) => {
    askConfirm(
      `Eliminar Tipo "${t.name}"`,
      'Si tiene rocas asociadas, el backend impedirá la eliminación (409). ¿Continuar?',
      async () => {
        try {
          await adminApi.deleteType(t.id);
          setActionMsg(`✔ Tipo ${t.name} eliminado.`);
          loadSectionData();
        } catch (err) {
          setActionMsg(`⚠ ${err.message}`);
        }
      }
    );
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim() || !newCatDesc.trim()) {
      setActionMsg('⚠ Nombre y descripción de categoría son obligatorios.');
      return;
    }
    try {
      await adminApi.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim()
      });
      setNewCatName('');
      setNewCatDesc('');
      setActionMsg('✔ Categoría creada.');
      loadSectionData();
    } catch (err) {
      setActionMsg(`⚠ ${err.message}`);
    }
  };

  const handleDeleteCategory = (c) => {
    askConfirm(
      `Eliminar Categoría "${c.name}"`,
      '¿Estás seguro de eliminar esta categoría del catálogo?',
      async () => {
        try {
          await adminApi.deleteCategory(c.id);
          setActionMsg(`✔ Categoría ${c.name} eliminada.`);
          loadSectionData();
        } catch (err) {
          setActionMsg(`⚠ ${err.message}`);
        }
      }
    );
  };

  const handleCreateRock = async () => {
    if (!rockForm.name.trim() || !rockForm.scientificName.trim() || !rockForm.index) {
      setActionMsg('⚠ Completa nombre, nombre científico e índice.');
      return;
    }
    try {
      await adminApi.createRock({
        name: rockForm.name.trim(),
        scientificName: rockForm.scientificName.trim(),
        index: Number(rockForm.index),
        hardness: Number(rockForm.hardness) || 5,
        composition: rockForm.composition || 'Mineral',
        formula: 'Variable',
        environment: rockForm.environment || 'Geológico',
        commonUses: 'Estudio y construcción',
        streak: 'Blanca',
        color: 'Variable',
        texture: 'Granular',
        density: 2.6,
        transparency: 0,
        tenacity: 1,
        imgUrl: 'https://example.org/rock.jpg',
        mindatUrl: 'https://www.mindat.org/',
        typeId: types[0]?.id || 1,
        categoryId: categories[0]?.id || 1
      });
      setRockForm({
        name: '',
        scientificName: '',
        index: '',
        hardness: '6',
        composition: 'Silicatos',
        environment: 'Continental'
      });
      setActionMsg('✔ Roca añadida al catálogo.');
      loadSectionData();
    } catch (err) {
      setActionMsg(`⚠ ${err.message}`);
    }
  };

  const handleDeleteRock = (r) => {
    askConfirm(
      `Desactivar / Eliminar "${r.name}"`,
      '¿Confirmas retirar este espécimen del catálogo?',
      async () => {
        try {
          await adminApi.deleteRock(r.id);
          setActionMsg(`✔ Roca ${r.name} eliminada.`);
          loadSectionData();
        } catch (err) {
          setActionMsg(`⚠ ${err.message}`);
        }
      }
    );
  };

  const handleCreateAchievement = async () => {
    if (!achForm.name.trim() || !achForm.slug.trim() || !achForm.description.trim()) {
      setActionMsg('⚠ Completa nombre, slug y descripción del logro.');
      return;
    }
    try {
      await adminApi.createAchievement({
        name: achForm.name.trim(),
        slug: achForm.slug.trim(),
        description: achForm.description.trim(),
        experience: Number(achForm.experience) || 15,
        isActive: true
      });
      setAchForm({ name: '', slug: '', description: '', experience: '20' });
      setActionMsg('✔ Logro registrado.');
      loadSectionData();
    } catch (err) {
      setActionMsg(`⚠ ${err.message}`);
    }
  };

  const handleToggleAchievement = async (a) => {
    try {
      await adminApi.updateAchievement(a.id, { isActive: !a.isActive });
      setActionMsg(`✔ Logro ${a.name} ${!a.isActive ? 'activado' : 'desactivado'}.`);
      loadSectionData();
    } catch (err) {
      setActionMsg(`⚠ ${err.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {[
          ['stats', '📊 Supervisión'],
          ['users', '👥 Usuarios'],
          ['catalog', '🪨 Catálogo'],
          ['achievements', '🏆 Logros']
        ].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            onPress={() => {
              setActionMsg('');
              setTab(key);
            }}
            style={[styles.navTab, tab === key && styles.navTabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
          >
            <Text style={[styles.navTabText, tab === key && styles.navTabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {actionMsg ? (
        <View style={styles.msgBanner}>
          <Text style={styles.msgText}>{actionMsg}</Text>
        </View>
      ) : null}

      {loading ? (
        <LoadingState message="Cargando panel de administración..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadSectionData} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xl }}>
          {tab === 'stats' && (
            <>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Métricas Globales de la Plataforma</Text>
                <Text style={styles.statLine}>
                  👥 Usuarios registrados: <Text style={styles.bold}>{stats?.registeredUsers ?? 0}</Text>
                </Text>
                <Text style={styles.statLine}>
                  🔎 Total de reconocimientos: <Text style={styles.bold}>{stats?.totalRecognitions ?? 0}</Text>
                </Text>
                <Text style={[styles.subTitle, { marginTop: SPACING.sm }]}>
                  Rocas más reconocidas:
                </Text>
                {(stats?.mostRecognizedRocks || []).map((r) => (
                  <Text key={r.rockId} style={styles.itemLine}>
                    • {r.name}: {r.count} reconocimientos
                  </Text>
                ))}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Últimos Reconocimientos Globales</Text>
                {recognitions.map((rec) => (
                  <View key={rec.id} style={styles.rowItem}>
                    <Text style={styles.rowTitle}>
                      #{rec.id} · {rec.result || rec.rock?.name} ({rec.confidence}%)
                    </Text>
                    <Text style={styles.rowSub}>
                      Usuario: {rec.user?.userName || 'Sesión de Invitado'}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Retroalimentación de Usuarios (Feedback)</Text>
                {feedbacks.length === 0 ? (
                  <Text style={styles.rowSub}>Sin evaluaciones registradas.</Text>
                ) : (
                  feedbacks.map((fb) => (
                    <View key={fb.id} style={styles.rowItem}>
                      <Text style={styles.rowTitle}>
                        {fb.isCorrect ? '👍 Correcto' : '👎 Incorrecto'} ·{' '}
                        {fb.analysis?.rock?.name || `Análisis #${fb.analysisId}`}
                      </Text>
                      <Text style={styles.rowSub}>
                        Por {fb.user?.userName}: "{fb.comment || 'Sin comentario'}"
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </>
          )}

          {tab === 'users' && (
            <>
              {inspectedUser ? (
                <View style={[styles.card, { borderColor: COLORS.primary, borderWidth: 2 }]}>
                  <Text style={styles.sectionTitle}>
                    Inspección de: {inspectedUser.userName}
                  </Text>
                  <Text style={styles.subTitle}>
                    Colección ({inspectedData.collection.length}):
                  </Text>
                  {inspectedData.collection.map((c) => (
                    <Text key={c.id} style={styles.itemLine}>
                      • {c.rock?.name} ({c.recognitionCount}x)
                    </Text>
                  ))}
                  <Text style={[styles.subTitle, { marginTop: 6 }]}>
                    Logros ({inspectedData.achievements.length}):
                  </Text>
                  {inspectedData.achievements.map((a) => (
                    <Text key={a.achievementId} style={styles.itemLine}>
                      • {a.achievement?.name}
                    </Text>
                  ))}
                  <AppButton
                    title="Cerrar inspección"
                    variant="outline"
                    onPress={() => setInspectedUser(null)}
                    style={{ marginTop: SPACING.sm }}
                  />
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Gestión de Usuarios Registrados</Text>
                {users.map((u) => (
                  <View key={u.id} style={styles.userBox}>
                    <Text style={styles.rowTitle}>
                      {u.userName} ({u.email})
                    </Text>
                    <Text style={styles.rowSub}>
                      Estado actual: <Text style={styles.bold}>{u.status}</Text> · Rol ID: {u.roleId}
                    </Text>

                    <View style={styles.roleChips}>
                      {roles.map((r) => (
                        <TouchableOpacity
                          key={r.id}
                          onPress={() => handleChangeUserRole(u, r.id)}
                          style={[
                            styles.smallChip,
                            u.roleId === r.id && styles.smallChipActive
                          ]}
                        >
                          <Text
                            style={[
                              styles.smallChipText,
                              u.roleId === r.id && { color: '#FFF' }
                            ]}
                          >
                            {r.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={{ flexDirection: 'row', marginTop: 6 }}>
                      <AppButton
                        title={u.status === 'active' ? 'Bloquear' : 'Activar'}
                        variant={u.status === 'active' ? 'danger' : 'primary'}
                        onPress={() => handleToggleUserStatus(u)}
                        style={{ flex: 1, marginRight: 8 }}
                      />
                      <AppButton
                        title="Ver Colección/Logros"
                        variant="outline"
                        onPress={() => handleInspectUser(u)}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {tab === 'catalog' && (
            <>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Registrar Nueva Roca</Text>
                <FormField
                  label="Nombre común *"
                  value={rockForm.name}
                  onChangeText={(v) => setRockForm({ ...rockForm, name: v })}
                  placeholder="ej. Obsidiana"
                />
                <FormField
                  label="Nombre científico (único) *"
                  value={rockForm.scientificName}
                  onChangeText={(v) => setRockForm({ ...rockForm, scientificName: v })}
                  placeholder="ej. Obsidian"
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <FormField
                      label="Índice # *"
                      value={rockForm.index}
                      onChangeText={(v) => setRockForm({ ...rockForm, index: v })}
                      keyboardType="numeric"
                      placeholder="15"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField
                      label="Dureza (1-10) *"
                      value={rockForm.hardness}
                      onChangeText={(v) => setRockForm({ ...rockForm, hardness: v })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <AppButton title="Crear Roca en Catálogo" onPress={handleCreateRock} />
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Rocas en Catálogo ({rocks.length})</Text>
                {rocks.map((r) => (
                  <View key={r.id} style={styles.rowBetween}>
                    <Text style={styles.rowTitle}>
                      #{r.index} {r.name} ({r.scientificName})
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteRock(r)}
                      style={styles.delBtn}
                      accessibilityRole="button"
                    >
                      <Text style={styles.delBtnText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Tipos de Roca</Text>
                <FormField
                  label="Nuevo Tipo"
                  value={newTypeName}
                  onChangeText={setNewTypeName}
                  placeholder="ej. Piroclástica"
                />
                <AppButton title="Añadir Tipo" onPress={handleCreateType} />
                {types.map((t) => (
                  <View key={t.id} style={styles.rowBetween}>
                    <Text style={styles.rowTitle}>{t.name}</Text>
                    <TouchableOpacity onPress={() => handleDeleteType(t)} style={styles.delBtn}>
                      <Text style={styles.delBtnText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Categorías de Roca</Text>
                <FormField
                  label="Nombre de Categoría"
                  value={newCatName}
                  onChangeText={setNewCatName}
                  placeholder="ej. No Foliada"
                />
                <FormField
                  label="Descripción"
                  value={newCatDesc}
                  onChangeText={setNewCatDesc}
                  placeholder="Rocas metamórficas sin bandas..."
                />
                <AppButton title="Añadir Categoría" onPress={handleCreateCategory} />
                {categories.map((c) => (
                  <View key={c.id} style={styles.rowBetween}>
                    <Text style={styles.rowTitle}>{c.name}</Text>
                    <TouchableOpacity onPress={() => handleDeleteCategory(c)} style={styles.delBtn}>
                      <Text style={styles.delBtnText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          {tab === 'achievements' && (
            <>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Crear Nuevo Logro</Text>
                <FormField
                  label="Nombre *"
                  value={achForm.name}
                  onChangeText={(v) => setAchForm({ ...achForm, name: v })}
                  placeholder="ej. Coleccionista Experto"
                />
                <FormField
                  label="Slug único *"
                  value={achForm.slug}
                  onChangeText={(v) => setAchForm({ ...achForm, slug: v })}
                  placeholder="ej. coleccionista-experto"
                />
                <FormField
                  label="Descripción *"
                  value={achForm.description}
                  onChangeText={(v) => setAchForm({ ...achForm, description: v })}
                  placeholder="Completa 20 análisis geológicos"
                />
                <AppButton title="Registrar Logro" onPress={handleCreateAchievement} />
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Logros del Sistema</Text>
                {achievements.map((a) => (
                  <View key={a.id} style={styles.rowBetween}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.rowTitle}>
                        {a.name} ({a.isActive ? 'Activo' : 'Inactivo'})
                      </Text>
                      <Text style={styles.rowSub}>{a.description}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleAchievement(a)}
                      style={styles.toggleBtn}
                    >
                      <Text style={styles.toggleBtnText}>
                        {a.isActive ? 'Desactivar' : 'Activar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <ConfirmModal
        visible={confirmState.visible}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.xs
  },
  navTab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent'
  },
  navTabActive: { borderBottomColor: COLORS.primary },
  navTabText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  navTabTextActive: { color: COLORS.primary },
  msgBanner: {
    backgroundColor: COLORS.surfaceAlt,
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  msgText: { fontSize: 13, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  subTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  statLine: { fontSize: 15, color: COLORS.text, marginBottom: 4 },
  itemLine: { fontSize: 14, color: COLORS.text, marginTop: 2 },
  bold: { fontWeight: '800', color: COLORS.primary },
  rowItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  rowSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  userBox: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  roleChips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4
  },
  smallChipActive: { backgroundColor: COLORS.primary },
  smallChipText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  delBtn: {
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  delBtnText: { color: COLORS.danger, fontSize: 12, fontWeight: '700' },
  toggleBtn: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  toggleBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' }
});