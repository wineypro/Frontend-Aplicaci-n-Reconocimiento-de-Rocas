import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { adminApi, catalogApi, progressApi } from '../../api/services';
import {
  LoadingState,
  ErrorState,
  AppButton,
  FormField,
  ConfirmModal
} from '../../components/UI';
import { COLORS, SPACING } from '../../theme/theme';

const EMPTY_ROCK_FORM = {
  name: '',
  scientificName: '',
  hardness: '6',
  composition: 'Silicatos',
  environment: 'Corteza terrestre',
  description: '',
  typeId: null,
  categoryId: null
};

const EMPTY_ACH_FORM = {
  name: '',
  slug: '',
  description: '',
  experience: '20',
  conditionType: 'distinct_rocks',
  conditionValue: '5'
};

export default function AdminScreen() {
  const scrollRef = useRef(null);
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

  // Inspección y edición de un usuario
  const [inspectedUser, setInspectedUser] = useState(null);
  const [inspectedData, setInspectedData] = useState({ collection: [], achievements: [] });
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ userName: '', email: '', phone: '' });

  // Formularios de Catálogo (Creación y Edición)
  const [newTypeName, setNewTypeName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingRockId, setEditingRockId] = useState(null);
  const [rockForm, setRockForm] = useState(EMPTY_ROCK_FORM);

  // Formulario de Logros (Creación y Edición)
  const [editingAchId, setEditingAchId] = useState(null);
  const [achForm, setAchForm] = useState(EMPTY_ACH_FORM);

  // Modal de confirmación destructiva
  const [confirmState, setConfirmState] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

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
          catalogApi.listRocks({ limit: 100 }),
          catalogApi.listTypes(),
          catalogApi.listCategories()
        ]);
        const loadedTypes = tRes?.items || [];
        const loadedCats = cRes?.items || [];
        setRocks(rkRes?.items || []);
        setTypes(loadedTypes);
        setCategories(loadedCats);
        setRockForm((prev) => ({
          ...prev,
          typeId: prev.typeId || loadedTypes[0]?.id || 1,
          categoryId: prev.categoryId || loadedCats[0]?.id || 1
        }));
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

  // --- GESTIÓN DE USUARIOS ---
  const handleToggleUserStatus = (u) => {
    const nextStatus = u.status === 'active' ? 'blocked' : 'active';
    askConfirm(
      `${nextStatus === 'blocked' ? 'Bloquear' : 'Activar'} cuenta de ${u.userName}`,
      `¿Confirmas cambiar el estado de "${u.email}" a "${nextStatus}"?`,
      async () => {
        try {
          await adminApi.updateUser(u.id, { status: nextStatus });
          setActionMsg(`Estado de ${u.userName} actualizado a ${nextStatus}.`);
          loadSectionData();
        } catch (err) {
          setActionMsg(`Error: ${err.message}`);
        }
      }
    );
  };

  const handleChangeUserRole = async (u, roleId) => {
    try {
      await adminApi.updateUser(u.id, { roleId: Number(roleId) });
      setActionMsg(`Rol de ${u.userName} actualizado correctamente.`);
      loadSectionData();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleInspectUser = async (u) => {
    setActionMsg('');
    try {
      const [col, ach] = await Promise.all([
        adminApi.getUserCollection(u.id, { limit: 50 }),
        adminApi.getUserAchievements(u.id, { limit: 50 })
      ]);
      const validCollection = (col?.items || []).filter((item) => item.rock != null);
      const validAchievements = (ach?.items || []).filter((item) => item.achievement != null);

      setInspectedUser(u);
      setInspectedData({
        collection: validCollection,
        achievements: validAchievements
      });
      scrollToTop();
    } catch (err) {
      setActionMsg(`Error al inspeccionar usuario: ${err.message}`);
    }
  };

  const startEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      userName: u.userName || '',
      email: u.email || '',
      phone: u.phone || ''
    });
    scrollToTop();
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    if (!userForm.userName.trim() || !userForm.email.trim()) {
      setActionMsg('El nombre de usuario y el correo son obligatorios.');
      return;
    }
    try {
      await adminApi.updateUser(editingUser.id, {
        userName: userForm.userName.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim() || null
      });
      setActionMsg(`Datos de ${userForm.userName} actualizados.`);
      setEditingUser(null);
      loadSectionData();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  // --- GESTIÓN DE CATÁLOGO (ROCAS, TIPOS, CATEGORÍAS) ---
  const startEditRock = (r) => {
    setEditingRockId(r.id);
    setRockForm({
      name: r.name || '',
      scientificName: r.scientificName || '',
      hardness: String(r.hardness ?? '6'),
      composition: r.composition || 'Silicatos',
      environment: r.environment || 'Corteza terrestre',
      description: r.description || '',
      typeId: r.typeId || r.type?.id || types[0]?.id || 1,
      categoryId: r.categoryId || r.category?.id || categories[0]?.id || 1
    });
    scrollToTop();
  };

  const cancelEditRock = () => {
    setEditingRockId(null);
    setRockForm({
      ...EMPTY_ROCK_FORM,
      typeId: types[0]?.id || 1,
      categoryId: categories[0]?.id || 1
    });
  };

  const handleSaveRock = async () => {
    if (!rockForm.name.trim() || !rockForm.scientificName.trim()) {
      setActionMsg('Por favor completa el nombre común y el nombre científico.');
      return;
    }
    const parsedHardness = Math.min(10, Math.max(1, Math.round(Number(rockForm.hardness) || 6)));
    const payload = {
      name: rockForm.name.trim(),
      scientificName: rockForm.scientificName.trim(),
      hardness: parsedHardness,
      composition: rockForm.composition.trim() || 'Silicatos',
      environment: rockForm.environment.trim() || 'Corteza terrestre',
      description: rockForm.description.trim() || 'Espécimen registrado en el catálogo.',
      typeId: Number(rockForm.typeId || types[0]?.id || 1),
      categoryId: Number(rockForm.categoryId || categories[0]?.id || 1)
    };

    try {
      if (editingRockId) {
        await adminApi.updateRock(editingRockId, payload);
        setActionMsg(`Roca "${payload.name}" actualizada correctamente.`);
      } else {
        await adminApi.createRock({
          ...payload,
          formula: 'No aplica (Roca)',
          commonUses: 'Estudio geológico y construcción',
          streak: 'Blanca',
          color: 'Característico del espécimen',
          texture: 'Granular',
          density: 2.7,
          transparency: 0,
          tenacity: 1,
          imgUrl: 'default.jpg',
          mindatUrl: 'https://www.mindat.org/'
        });
        setActionMsg(`Roca "${payload.name}" añadida al catálogo con índice automático.`);
      }
      cancelEditRock();
      loadSectionData();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleDeleteRock = (r) => {
    askConfirm(
      `Eliminar "${r.name}"`,
      '¿Confirmas retirar este espécimen del catálogo?',
      async () => {
        try {
          await adminApi.deleteRock(r.id);
          if (editingRockId === r.id) cancelEditRock();
          setActionMsg(`Roca ${r.name} eliminada del catálogo.`);
          loadSectionData();
        } catch (err) {
          setActionMsg(`Error: ${err.message}`);
        }
      }
    );
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;
    try {
      await adminApi.createType({ name: newTypeName.trim() });
      setNewTypeName('');
      setActionMsg('Tipo de roca creado.');
      loadSectionData();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleDeleteType = (t) => {
    askConfirm(
      `Eliminar Tipo "${t.name}"`,
      'Si tiene rocas asociadas, no se permitirá la eliminación para proteger el catálogo. ¿Continuar?',
      async () => {
        try {
          await adminApi.deleteType(t.id);
          setActionMsg(`Tipo ${t.name} eliminado.`);
          loadSectionData();
        } catch (err) {
          setActionMsg(`Error: ${err.message}`);
        }
      }
    );
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim() || !newCatDesc.trim()) {
      setActionMsg('Nombre y descripción de categoría son obligatorios.');
      return;
    }
    try {
      await adminApi.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim()
      });
      setNewCatName('');
      setNewCatDesc('');
      setActionMsg('Categoría creada.');
      loadSectionData();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleDeleteCategory = (c) => {
    askConfirm(
      `Eliminar Categoría "${c.name}"`,
      '¿Estás seguro de eliminar esta categoría del catálogo?',
      async () => {
        try {
          await adminApi.deleteCategory(c.id);
          setActionMsg(`Categoría ${c.name} eliminada.`);
          loadSectionData();
        } catch (err) {
          setActionMsg(`Error: ${err.message}`);
        }
      }
    );
  };

  // --- GESTIÓN DE LOGROS ---
  const startEditAchievement = (a) => {
    setEditingAchId(a.id);
    setAchForm({
      name: a.name || '',
      slug: a.slug || '',
      description: a.description || '',
      experience: String(a.experience ?? '20'),
      conditionType: a.conditionType || 'distinct_rocks',
      conditionValue: String(a.conditionValue ?? '5')
    });
    scrollToTop();
  };

  const cancelEditAchievement = () => {
    setEditingAchId(null);
    setAchForm(EMPTY_ACH_FORM);
  };

  const handleSaveAchievement = async () => {
    if (!achForm.name.trim() || !achForm.slug.trim() || !achForm.description.trim()) {
      setActionMsg('Completa nombre, identificador (slug) y descripción del logro.');
      return;
    }
    const targetVal = Math.max(1, Math.round(Number(achForm.conditionValue) || 1));
    const payload = {
      name: achForm.name.trim(),
      slug: achForm.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      description: achForm.description.trim(),
      experience: Math.max(1, Math.round(Number(achForm.experience) || 20)),
      conditionType: achForm.conditionType,
      conditionValue: targetVal,
      isActive: true
    };

    try {
      if (editingAchId) {
        await adminApi.updateAchievement(editingAchId, payload);
        setActionMsg(`Logro "${payload.name}" actualizado.`);
      } else {
        await adminApi.createAchievement(payload);
        setActionMsg(`Logro "${payload.name}" registrado con desbloqueo automático.`);
      }
      cancelEditAchievement();
      loadSectionData();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleToggleAchievement = async (a) => {
    try {
      await adminApi.updateAchievement(a.id, { isActive: !a.isActive });
      setActionMsg(`Logro ${a.name} ${!a.isActive ? 'activado' : 'desactivado'}.`);
      loadSectionData();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const formatConditionLabel = (a) => {
    if (!a.conditionType || !a.conditionValue) return 'Desbloqueo manual';
    if (a.conditionType === 'distinct_rocks') {
      return `Al descubrir ${a.conditionValue} roca(s) distinta(s)`;
    }
    if (a.conditionType === 'total_recognitions') {
      return `Al completar ${a.conditionValue} escaneo(s) en total`;
    }
    return `${a.conditionType}: ${a.conditionValue}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {[
          ['stats', 'Supervisión'],
          ['users', 'Usuarios'],
          ['catalog', 'Catálogo'],
          ['achievements', 'Logros']
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
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xl }}
        >
          {tab === 'stats' && (
            <>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Métricas Globales de la Plataforma</Text>
                <Text style={styles.statLine}>
                  Usuarios registrados: <Text style={styles.bold}>{stats?.registeredUsers ?? 0}</Text>
                </Text>
                <Text style={styles.statLine}>
                  Total de escaneos realizados: <Text style={styles.bold}>{stats?.totalRecognitions ?? 0}</Text>
                </Text>
                <Text style={[styles.subTitle, { marginTop: SPACING.sm }]}>
                  Especímenes más escaneados:
                </Text>
                {(stats?.mostRecognizedRocks || []).length === 0 ? (
                  <Text style={styles.rowSub}>Aún no hay escaneos registrados.</Text>
                ) : (
                  (stats?.mostRecognizedRocks || []).map((r) => (
                    <Text key={r.rockId} style={styles.itemLine}>
                      • {r.name}: {r.count} escaneo(s)
                    </Text>
                  ))
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Últimos Escaneos Globales</Text>
                {recognitions.length === 0 ? (
                  <Text style={styles.rowSub}>Sin escaneos recientes.</Text>
                ) : (
                  recognitions.map((rec) => (
                    <View key={rec.id} style={styles.rowItem}>
                      <Text style={styles.rowTitle}>
                        #{rec.id} · {rec.rock?.name || rec.result || 'Espécimen'} ({rec.confidence}%)
                      </Text>
                      <Text style={styles.rowSub}>
                        Usuario: {rec.user?.userName || 'Sesión de Invitado'}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Retroalimentación de Usuarios (Feedback)</Text>
                {feedbacks.length === 0 ? (
                  <Text style={styles.rowSub}>Sin evaluaciones registradas.</Text>
                ) : (
                  feedbacks.map((fb) => (
                    <View key={fb.id} style={styles.rowItem}>
                      <Text style={styles.rowTitle}>
                        {fb.isCorrect ? 'Correcto' : 'Incorrecto'} ·{' '}
                        {fb.analysis?.rock?.name || `Análisis #${fb.analysisId}`}
                      </Text>
                      <Text style={styles.rowSub}>
                        Por {fb.user?.userName || 'Usuario'}: "{fb.comment || 'Sin comentario'}"
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </>
          )}

          {tab === 'users' && (
            <>
              {editingUser ? (
                <View style={[styles.card, { borderColor: COLORS.secondary, borderWidth: 2 }]}>
                  <Text style={styles.sectionTitle}>
                    Editar Usuario: {editingUser.userName}
                  </Text>
                  <FormField
                    label="Nombre de usuario *"
                    value={userForm.userName}
                    onChangeText={(v) => setUserForm({ ...userForm, userName: v })}
                  />
                  <FormField
                    label="Correo electrónico *"
                    value={userForm.email}
                    onChangeText={(v) => setUserForm({ ...userForm, email: v })}
                    keyboardType="email-address"
                  />
                  <FormField
                    label="Teléfono (opcional)"
                    value={userForm.phone}
                    onChangeText={(v) => setUserForm({ ...userForm, phone: v })}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <AppButton
                      title="Guardar Cambios"
                      onPress={handleSaveUserEdit}
                      style={{ flex: 1 }}
                    />
                    <AppButton
                      title="Cancelar"
                      variant="outline"
                      onPress={() => setEditingUser(null)}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              ) : null}

              {inspectedUser ? (
                <View style={[styles.card, { borderColor: COLORS.primary, borderWidth: 2 }]}>
                  <Text style={styles.sectionTitle}>
                    Inspección de: {inspectedUser.userName} ({inspectedUser.email})
                  </Text>
                  <Text style={styles.subTitle}>
                    Colección descubierta ({inspectedData.collection.length}):
                  </Text>
                  {inspectedData.collection.length === 0 ? (
                    <Text style={styles.rowSub}>Este usuario aún no tiene rocas en su colección.</Text>
                  ) : (
                    inspectedData.collection.map((c) => (
                      <Text key={c.id || c.rockId} style={styles.itemLine}>
                        • {c.rock?.name} — identificada {c.recognitionCount} vez/veces
                      </Text>
                    ))
                  )}

                  <Text style={[styles.subTitle, { marginTop: 10 }]}>
                    Logros desbloqueados ({inspectedData.achievements.length}):
                  </Text>
                  {inspectedData.achievements.length === 0 ? (
                    <Text style={styles.rowSub}>Este usuario aún no ha desbloqueado logros.</Text>
                  ) : (
                    inspectedData.achievements.map((a) => (
                      <Text key={a.achievementId} style={styles.itemLine}>
                        • {a.achievement?.name} (+{a.achievement?.experience || 0} XP)
                      </Text>
                    ))
                  )}
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
                      Estado: <Text style={styles.bold}>{u.status}</Text>
                      {u.phone ? ` · Tel: ${u.phone}` : ''}
                    </Text>

                    <Text style={[styles.rowSub, { marginTop: 6, fontWeight: '700' }]}>
                      Rol asignado:
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

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      <AppButton
                        title="Editar Datos"
                        variant="secondary"
                        onPress={() => startEditUser(u)}
                        style={{ flex: 1, minWidth: 110 }}
                      />
                      <AppButton
                        title="Ver Colección/Logros"
                        variant="outline"
                        onPress={() => handleInspectUser(u)}
                        style={{ flex: 1, minWidth: 140 }}
                      />
                      <AppButton
                        title={u.status === 'active' ? 'Bloquear' : 'Activar'}
                        variant={u.status === 'active' ? 'danger' : 'primary'}
                        onPress={() => handleToggleUserStatus(u)}
                        style={{ flex: 1, minWidth: 100 }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {tab === 'catalog' && (
            <>
              <View
                style={[
                  styles.card,
                  editingRockId && { borderColor: COLORS.secondary, borderWidth: 2 }
                ]}
              >
                <Text style={styles.sectionTitle}>
                  {editingRockId ? 'Editar Roca del Catálogo' : 'Registrar Nueva Roca (Índice Automático)'}
                </Text>
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
                <FormField
                  label="Dureza en escala de Mohs (1-10) *"
                  value={rockForm.hardness}
                  onChangeText={(v) => setRockForm({ ...rockForm, hardness: v })}
                  keyboardType="numeric"
                  placeholder="6"
                />

                <Text style={styles.fieldLabel}>Tipo Geológico *</Text>
                <View style={styles.roleChips}>
                  {types.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setRockForm({ ...rockForm, typeId: t.id })}
                      style={[
                        styles.smallChip,
                        Number(rockForm.typeId) === Number(t.id) && styles.smallChipActive
                      ]}
                    >
                      <Text
                        style={[
                          styles.smallChipText,
                          Number(rockForm.typeId) === Number(t.id) && { color: '#FFF' }
                        ]}
                      >
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Categoría *</Text>
                <View style={styles.roleChips}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setRockForm({ ...rockForm, categoryId: c.id })}
                      style={[
                        styles.smallChip,
                        Number(rockForm.categoryId) === Number(c.id) && styles.smallChipActive
                      ]}
                    >
                      <Text
                        style={[
                          styles.smallChipText,
                          Number(rockForm.categoryId) === Number(c.id) && { color: '#FFF' }
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <FormField
                  label="Composición *"
                  value={rockForm.composition}
                  onChangeText={(v) => setRockForm({ ...rockForm, composition: v })}
                  placeholder="ej. Cuarzo, feldespato y mica"
                />
                <FormField
                  label="Ambiente de formación *"
                  value={rockForm.environment}
                  onChangeText={(v) => setRockForm({ ...rockForm, environment: v })}
                  placeholder="ej. Plutónico / Volcánico"
                />
                <FormField
                  label="Descripción"
                  value={rockForm.description}
                  onChangeText={(v) => setRockForm({ ...rockForm, description: v })}
                  placeholder="Descripción geológica del espécimen..."
                />

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <AppButton
                    title={editingRockId ? 'Guardar Cambios' : 'Crear Roca en Catálogo'}
                    onPress={handleSaveRock}
                    style={{ flex: 1 }}
                  />
                  {editingRockId ? (
                    <AppButton
                      title="Cancelar"
                      variant="outline"
                      onPress={cancelEditRock}
                      style={{ flex: 1 }}
                    />
                  ) : null}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Rocas en Catálogo ({rocks.length})</Text>
                {rocks.map((r) => (
                  <View key={r.id} style={styles.rowBetween}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.rowTitle}>
                        #{r.index} {r.name} ({r.scientificName})
                      </Text>
                      <Text style={styles.rowSub}>
                        Tipo: {r.type?.name || 'N/A'} · Categoría: {r.category?.name || 'N/A'} · Mohs: {r.hardness}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => startEditRock(r)}
                        style={styles.toggleBtn}
                        accessibilityRole="button"
                      >
                        <Text style={styles.toggleBtnText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteRock(r)}
                        style={styles.delBtn}
                        accessibilityRole="button"
                      >
                        <Text style={styles.delBtnText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
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
              <View
                style={[
                  styles.card,
                  editingAchId && { borderColor: COLORS.secondary, borderWidth: 2 }
                ]}
              >
                <Text style={styles.sectionTitle}>
                  {editingAchId ? 'Editar Logro' : 'Crear Nuevo Logro'}
                </Text>
                <FormField
                  label="Nombre del logro *"
                  value={achForm.name}
                  onChangeText={(v) => setAchForm({ ...achForm, name: v })}
                  placeholder="ej. Coleccionista Experto"
                />
                <FormField
                  label="Identificador único (slug) *"
                  value={achForm.slug}
                  onChangeText={(v) => setAchForm({ ...achForm, slug: v })}
                  placeholder="ej. coleccionista-experto"
                />
                <FormField
                  label="Descripción *"
                  value={achForm.description}
                  onChangeText={(v) => setAchForm({ ...achForm, description: v })}
                  placeholder="Descubre 10 especímenes distintos"
                />

                <Text style={styles.fieldLabel}>Regla automática de desbloqueo *</Text>
                <View style={styles.roleChips}>
                  {[
                    ['distinct_rocks', 'Rocas distintas descubiertas'],
                    ['total_recognitions', 'Total de escaneos realizados']
                  ].map(([condKey, condLabel]) => (
                    <TouchableOpacity
                      key={condKey}
                      onPress={() => setAchForm({ ...achForm, conditionType: condKey })}
                      style={[
                        styles.smallChip,
                        achForm.conditionType === condKey && styles.smallChipActive
                      ]}
                    >
                      <Text
                        style={[
                          styles.smallChipText,
                          achForm.conditionType === condKey && { color: '#FFF' }
                        ]}
                      >
                        {condLabel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <View style={{ flex: 1 }}>
                    <FormField
                      label="Meta numérica para desbloquear *"
                      value={achForm.conditionValue}
                      onChangeText={(v) => setAchForm({ ...achForm, conditionValue: v })}
                      keyboardType="numeric"
                      placeholder="5"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField
                      label="Puntos de Experiencia (XP) *"
                      value={achForm.experience}
                      onChangeText={(v) => setAchForm({ ...achForm, experience: v })}
                      keyboardType="numeric"
                      placeholder="20"
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <AppButton
                    title={editingAchId ? 'Guardar Cambios' : 'Registrar Logro'}
                    onPress={handleSaveAchievement}
                    style={{ flex: 1 }}
                  />
                  {editingAchId ? (
                    <AppButton
                      title="Cancelar"
                      variant="outline"
                      onPress={cancelEditAchievement}
                      style={{ flex: 1 }}
                    />
                  ) : null}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Logros del Sistema ({achievements.length})</Text>
                {achievements.map((a) => (
                  <View key={a.id} style={styles.rowBetween}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.rowTitle}>
                        {a.name} ({a.isActive ? 'Activo' : 'Inactivo'}) · +{a.experience || 0} XP
                      </Text>
                      <Text style={styles.rowSub}>{a.description}</Text>
                      <Text style={[styles.rowSub, { color: COLORS.primary, fontWeight: '700' }]}>
                        Condición: {formatConditionLabel(a)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => startEditAchievement(a)}
                        style={styles.toggleBtn}
                      >
                        <Text style={styles.toggleBtnText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleToggleAchievement(a)}
                        style={[
                          styles.toggleBtn,
                          !a.isActive && { backgroundColor: COLORS.successBg || '#D4EDDA' }
                        ]}
                      >
                        <Text style={styles.toggleBtnText}>
                          {a.isActive ? 'Desactivar' : 'Activar'}
                        </Text>
                      </TouchableOpacity>
                    </View>
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
  navTabText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
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
  fieldLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 4, marginBottom: 6 },
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  roleChips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, marginBottom: 8 },
  smallChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6
  },
  smallChipActive: { backgroundColor: COLORS.primary },
  smallChipText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  delBtn: {
    backgroundColor: COLORS.dangerBg || '#F8D7DA',
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