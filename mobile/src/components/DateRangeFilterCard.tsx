import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { showToast } from '../services/toast';
import { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { AppIcon } from './AppIcon';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';

interface DateRangeFilterCardProps {
  fromDate: string;
  toDate: string;
  onChangeFromDate: (value: string) => void;
  onChangeToDate: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
  loading?: boolean;
}

type PickerTarget = 'from' | 'to';

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: string) => {
  if (!value) {
    return new Date();
  }

  const parsedDate = new Date(`${value}T12:00:00`);

  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

const buildDisplayValue = (value: string) => {
  if (!value) {
    return 'Pick a date';
  }

  const parsedDate = parseDateValue(value);

  return parsedDate.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getRangeError = (fromDate: string, toDate: string) => {
  if (!fromDate || !toDate) {
    return '';
  }

  if (parseDateValue(fromDate).getTime() > parseDateValue(toDate).getTime()) {
    return 'End date must be on or after start date.';
  }

  return '';
};

export const DateRangeFilterCard = ({
  fromDate,
  toDate,
  onChangeFromDate,
  onChangeToDate,
  onApply,
  onClear,
  loading,
}: DateRangeFilterCardProps) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [iosPickerTarget, setIosPickerTarget] = useState<PickerTarget | null>(null);
  const rangeError = getRangeError(fromDate, toDate);

  const pickerValue = useMemo(() => {
    if (!iosPickerTarget) {
      return new Date();
    }

    return parseDateValue(iosPickerTarget === 'from' ? fromDate : toDate);
  }, [fromDate, iosPickerTarget, toDate]);

  const updateDate = (target: PickerTarget, date?: Date) => {
    if (!date) {
      return;
    }

    const nextValue = formatDateValue(date);

    if (target === 'from') {
      onChangeFromDate(nextValue);
      return;
    }

    onChangeToDate(nextValue);
  };

  const openPicker = (target: PickerTarget) => {
    const today = new Date();
    const targetDate = target === 'from' ? fromDate : toDate;
    const upperBound =
      target === 'from' && toDate
        ? parseDateValue(toDate).getTime() < today.getTime()
          ? parseDateValue(toDate)
          : today
        : today;

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        maximumDate: upperBound,
        minimumDate: target === 'to' && fromDate ? parseDateValue(fromDate) : undefined,
        value: parseDateValue(targetDate),
        onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
          if (event.type !== 'set') {
            return;
          }

          updateDate(target, selectedDate);
        },
      });

      return;
    }

    setIosPickerTarget(target);
  };

  const handleApply = () => {
    if (rangeError) {
      showToast({
        type: 'error',
        title: 'Invalid date range',
        message: rangeError,
      });
      return;
    }

    onApply();
  };

  const minimumDate =
    iosPickerTarget === 'to' && fromDate ? parseDateValue(fromDate) : undefined;
  const maximumDate =
    iosPickerTarget === 'from' && toDate
      ? parseDateValue(toDate).getTime() < Date.now()
        ? parseDateValue(toDate)
        : new Date()
      : new Date();

  return (
    <Card style={styles.card}>
      <Text style={styles.heading}>Attendance filter</Text>
      <Text style={styles.hint}>Use the calendar to narrow results by shift date.</Text>

      <View style={styles.fieldRow}>
        <Pressable onPress={() => openPicker('from')} style={styles.pickerField}>
          <View style={styles.fieldHeader}>
            <Text style={styles.label}>Start Date</Text>
            <AppIcon color={theme.colors.accent} name="calendar-clear-outline" size={18} />
          </View>
          <Text style={styles.value}>{buildDisplayValue(fromDate)}</Text>
        </Pressable>

        <Pressable onPress={() => openPicker('to')} style={styles.pickerField}>
          <View style={styles.fieldHeader}>
            <Text style={styles.label}>End Date</Text>
            <AppIcon color={theme.colors.accent} name="calendar-outline" size={18} />
          </View>
          <Text style={styles.value}>{buildDisplayValue(toDate)}</Text>
        </Pressable>
      </View>

      {rangeError ? <Text style={styles.errorText}>{rangeError}</Text> : null}

      <Modal
        animationType="fade"
        visible={Platform.OS === 'ios' && Boolean(iosPickerTarget)}
        transparent
        onRequestClose={() => setIosPickerTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.inlineHeader}>
              <View style={styles.modalCopy}>
                <Text style={styles.inlineTitle}>
                  {iosPickerTarget === 'from' ? 'Select start date' : 'Select end date'}
                </Text>
                <Text style={styles.modalHint}>Pick a clean attendance range and apply it to the list below.</Text>
              </View>
              <PrimaryButton
                label="Done"
                onPress={() => setIosPickerTarget(null)}
                style={styles.doneButton}
                variant="outline"
              />
            </View>
            {iosPickerTarget ? (
              <DateTimePicker
                display="spinner"
                mode="date"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                value={pickerValue}
                onChange={(_, selectedDate) => updateDate(iosPickerTarget, selectedDate)}
              />
            ) : null}
          </View>
        </View>
      </Modal>

      <View style={styles.actions}>
        <PrimaryButton
          label="Clear"
          onPress={onClear}
          style={styles.secondaryAction}
          variant="outline"
        />
        <PrimaryButton
          label="Apply Filter"
          loading={loading}
          onPress={handleApply}
          style={styles.primaryAction}
          disabled={Boolean(rangeError)}
        />
      </View>
    </Card>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    card: {
      gap: theme.spacing.sm,
    },
    doneButton: {
      minHeight: 38,
      minWidth: 88,
    },
    errorText: {
      color: theme.colors.danger,
      lineHeight: 20,
    },
    fieldHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    fieldRow: {
      gap: theme.spacing.sm,
    },
    heading: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    hint: {
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    inlineHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    inlineTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 14,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    iosPickerShell: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: theme.spacing.sm,
      padding: theme.spacing.sm,
    },
    label: {
      color: theme.colors.textMuted,
      fontFamily: theme.fontFamily.heading,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    pickerField: {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: theme.spacing.xs,
      minHeight: 74,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    modalBackdrop: {
      alignItems: 'center',
      backgroundColor: theme.colors.overlay,
      flex: 1,
      justifyContent: 'center',
      padding: theme.spacing.md,
    },
    modalCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      width: '100%',
    },
    modalCopy: {
      flex: 1,
      gap: 4,
      paddingRight: theme.spacing.md,
    },
    modalHint: {
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
    primaryAction: {
      flex: 1.4,
    },
    secondaryAction: {
      flex: 1,
    },
    value: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
  });
