import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  StyleSheet
} from 'react-native';
import { COLORS, SPACING, MIN_TOUCH_SIZE } from '../theme/theme';

export const AppButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger'
  disabled = false,
  loading = false,
  accessibilityLabel,
  style
}) => {
  const bgMap = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    outline: 'transparent',
    danger: COLORS.danger
  };
  const textMap = {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    outline: COLORS.primary,
    danger: '#FFFFFF'
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.button,
        { backgroundColor: bgMap[variant] || COLORS.primary },
        variant === 'outline' && styles.buttonOutline,
        (disabled || loading) && styles.buttonDisabled,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textMap[variant]} />
      ) : (
        <Text style={[styles.buttonText, { color: textMap[variant] }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  multiline = false
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#8C9690"
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      multiline={multiline}
      accessibilityLabel={label}
      style={[
        styles.input,
        multiline && { minHeight: 84, textAlignVertical: 'top' },
        error && styles.inputError
      ]}
    />
    {error ? (
      <Text accessibilityRole="alert" style={styles.errorText}>
        ⚠ {error}
      </Text>
    ) : null}
  </View>
);

export const LoadingState = ({ message = 'Cargando información...' }) => (
  <View style={styles.centerBox} accessibilityRole="progressbar" accessibilityLabel={message}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.stateTitle}>{message}</Text>
  </View>
);

export const EmptyState = ({ icon = '🪨', title, description, actionLabel, onAction }) => (
  <View style={styles.centerBox}>
    <Text style={styles.stateIcon}>{icon}</Text>
    <Text style={styles.stateTitle}>{title}</Text>
    {description ? <Text style={styles.stateDesc}>{description}</Text> : null}
    {actionLabel && onAction ? (
      <AppButton title={actionLabel} onPress={onAction} style={{ marginTop: SPACING.md }} />
    ) : null}
  </View>
);

export const ErrorState = ({ message, onRetry }) => (
  <View style={styles.errorBox} accessibilityRole="alert">
    <Text style={styles.errorIcon}>⚠️ No se pudo completar la operación</Text>
    <Text style={styles.errorDesc}>{message}</Text>
    {onRetry ? (
      <AppButton
        title="Reintentar ahora"
        variant="outline"
        onPress={onRetry}
        style={{ marginTop: SPACING.sm }}
      />
    ) : null}
  </View>
);

export const GuestBanner = ({ guestInfo, onUpgradePress }) => {
  if (!guestInfo) return null;
  const remaining = guestInfo.remaining ?? Math.max(10 - (guestInfo.recognitionCount || 0), 0);
  const isExhausted = remaining <= 0;

  return (
    <View style={[styles.guestBanner, isExhausted && styles.guestBannerExhausted]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.guestBannerTitle}>
          {isExhausted
            ? '⛔ Límite de invitado alcanzado (0/10)'
            : `🧭 Sesión Temporal de Invitado: ${remaining} de ${guestInfo.limit || 10} reconocimientos disponibles`}
        </Text>
        <Text style={styles.guestBannerSub}>
          Tu progreso es temporal. Crea una cuenta para guardar tus hallazgos y desbloquear uso ilimitado.
        </Text>
      </View>
      {onUpgradePress ? (
        <TouchableOpacity
          onPress={onUpgradePress}
          accessibilityRole="button"
          accessibilityLabel="Crear cuenta y migrar progreso de invitado"
          style={styles.guestUpgradeBtn}
        >
          <Text style={styles.guestUpgradeText}>Guardar cuenta</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export const ConfirmModal = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
  onConfirm,
  onCancel
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.modalBackdrop}>
      <View style={styles.modalCard} accessibilityViewIsModal>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalMsg}>{message}</Text>
        <View style={styles.modalActions}>
          <AppButton
            title={cancelLabel}
            variant="outline"
            onPress={onCancel}
            style={{ flex: 1, marginRight: SPACING.sm }}
          />
          <AppButton
            title={confirmLabel}
            variant={danger ? 'danger' : 'primary'}
            onPress={onConfirm}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  buttonOutline: {
    borderWidth: 2,
    borderColor: COLORS.primary
  },
  buttonDisabled: {
    opacity: 0.55
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700'
  },
  fieldContainer: {
    marginBottom: SPACING.md
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6
  },
  input: {
    minHeight: MIN_TOUCH_SIZE,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text
  },
  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerBg
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4
  },
  centerBox: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stateIcon: {
    fontSize: 42,
    marginBottom: SPACING.sm
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.xs
  },
  stateDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20
  },
  errorBox: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.dangerBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.danger
  },
  errorIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.danger,
    marginBottom: 4
  },
  errorDesc: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20
  },
  guestBanner: {
    backgroundColor: COLORS.guestBg,
    borderColor: COLORS.guestBadge,
    borderWidth: 1.5,
    padding: SPACING.sm,
    borderRadius: 10,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center'
  },
  guestBannerExhausted: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.danger
  },
  guestBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text
  },
  guestBannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  guestUpgradeBtn: {
    minHeight: 40,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: SPACING.sm,
    justifyContent: 'center'
  },
  guestUpgradeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: SPACING.lg
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.lg
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs
  },
  modalMsg: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 21
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});