import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { catalogApi } from '../../api/services';
import { LoadingState, ErrorState, AppButton } from '../../components/UI';
import { COLORS, SPACING } from '../../theme/theme';

export default function RockDetailScreen({ route, navigation }) {
  const { rockId, initialRock } = route.params || {};
  const [rock, setRock] = useState(initialRock || null);
  const [typeName, setTypeName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(!initialRock);
  const [error, setError] = useState(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rData, tList, cList] = await Promise.all([
        catalogApi.getRock(rockId),
        catalogApi.listTypes(),
        catalogApi.listCategories()
      ]);
      setRock(rData);
      const t = (tList?.items || []).find((item) => item.id === rData.typeId);
      const c = (cList?.items || []).find((item) => item.id === rData.categoryId);
      setTypeName(t?.name || `Tipo #${rData.typeId}`);
      setCategoryName(c?.name || `Categoría #${rData.categoryId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [rockId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (loading) return <LoadingState message="Cargando ficha geológica..." />;
  if (error) return <ErrorState message={error} onRetry={loadDetail} />;
  if (!rock) return <ErrorState message="No se encontró la roca solicitada." />;

  const specs = [
    ['Tipo de roca', typeName || `ID ${rock.typeId}`],
    ['Categoría', categoryName || `ID ${rock.categoryId}`],
    ['Composición', rock.composition],
    ['Fórmula química', rock.formula],
    ['Ambiente de formación', rock.environment],
    ['Usos comunes', rock.commonUses],
    ['Dureza (Escala de Mohs)', `${rock.hardness} / 10`],
    ['Color', rock.color],
    ['Raya (Streak)', rock.streak],
    ['Textura', rock.texture],
    ['Densidad', `${rock.density} g/cm³`],
    ['Transparencia', String(rock.transparency)],
    ['Tenacidad', String(rock.tenacity)]
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.md }}>
      <Image
        source={{ uri: rock.imgUrl || 'https://via.placeholder.com/400x240.png?text=Roca' }}
        style={styles.heroImage}
        accessibilityLabel={`Fotografía de ${rock.name}`}
      />

      <View style={styles.card}>
        <Text style={styles.dexBadge}>ESPÉCIMEN #{rock.index}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {rock.name}
        </Text>
        <Text style={styles.sciName}>{rock.scientificName}</Text>
        <Text style={styles.description}>
          {rock.description || 'Sin descripción adicional registrada en el catálogo.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Propiedades Físicas y Geológicas</Text>
        {specs.map(([label, val]) => (
          <View key={label} style={styles.specRow}>
            <Text style={styles.specLabel}>{label}</Text>
            <Text style={styles.specVal}>{val ?? 'No especificado'}</Text>
          </View>
        ))}
      </View>

      <AppButton
        title="Volver al catálogo"
        variant="outline"
        onPress={() => navigation.goBack()}
        style={{ marginBottom: SPACING.xl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heroImage: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    marginBottom: SPACING.md
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  dexBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  sciName: {
    fontSize: 15,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm
  },
  description: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt
  },
  specLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, flex: 1 },
  specVal: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'right' }
});