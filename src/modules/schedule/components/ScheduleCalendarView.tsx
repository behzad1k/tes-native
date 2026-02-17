import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";
import { Task } from "../types";
import { MONTHS, WEEKDAYS } from "@/src/constants/schedule";

interface ScheduleCalendarViewProps {
  tasks: Task[];
  onDayPress?: (date: Date, tasks: Task[]) => void;
  onTaskPress?: (task: Task) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CALENDAR_PADDING = spacing.sm * 2;
const DAY_WIDTH = (SCREEN_WIDTH - CALENDAR_PADDING) / 7;
const DAY_NUMBER_HEIGHT = 24;
const TASK_BAR_HEIGHT = 14;
const TASK_BAR_GAP = 2;
const TASK_BAR_MARGIN = 2;

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  globalIndex: number; // Index within the entire month grid
}

interface TaskPosition {
  task: Task;
  startIndex: number;
  endIndex: number;
  row: number;
}

interface WeekData {
  days: CalendarDay[];
  weekIndex: number;
  taskBars: TaskBarData[];
}

interface TaskBarData {
  task: Task;
  startCol: number; // 0-6 within the week
  endCol: number; // 0-6 within the week
  row: number;
  isStart: boolean; // Is this the actual start of the task?
  isEnd: boolean; // Is this the actual end of the task?
}

const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  tasks,
  onDayPress,
  onTaskPress,
}) => {
  const styles = useThemedStyles(createStyles);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate months to display (3 months)
  const months = useMemo(() => {
    const result: MonthData[] = [];
    const today = new Date();

    for (let i = 0; i < 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      result.push(generateMonthData(date, tasks));
    }

    return result;
  }, [tasks]);

  const handleDayPress = (day: CalendarDay) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.date);
      const dayTasks = tasks.filter((task) => {
        const startDate = parseDate(task.startDate);
        const endDate = parseDate(task.endDate);
        if (!startDate || !endDate) return false;
        const dayStart = new Date(
          day.date.getFullYear(),
          day.date.getMonth(),
          day.date.getDate(),
        );
        return dayStart >= startDate && dayStart <= endDate;
      });
      onDayPress?.(day.date, dayTasks);
    }
  };

  const renderTaskBar = (bar: TaskBarData) => {
    const leftPos = bar.startCol * DAY_WIDTH + TASK_BAR_MARGIN;
    const width =
      (bar.endCol - bar.startCol + 1) * DAY_WIDTH - TASK_BAR_MARGIN * 2;
    const topPos = bar.row * (TASK_BAR_HEIGHT + TASK_BAR_GAP);

    return (
      <TouchableOpacity
        key={`${bar.task.id}-${bar.startCol}-${bar.row}`}
        style={[
          styles.taskBar,
          {
            left: leftPos,
            width: width,
            top: topPos,
            borderTopLeftRadius: bar.isStart ? 2 : 0,
            borderBottomLeftRadius: bar.isStart ? 2 : 0,
            borderTopRightRadius: bar.isEnd ? 2 : 0,
            borderBottomRightRadius: bar.isEnd ? 2 : 0,
          },
        ]}
        onPress={() => onTaskPress?.(bar.task)}
        activeOpacity={0.7}
      >
        {bar.isStart && (
          <TextView style={styles.taskBarText} numberOfLines={1}>
            {bar.task.taskNumber}
          </TextView>
        )}
      </TouchableOpacity>
    );
  };

  const renderDay = (day: CalendarDay) => {
    const isSelected =
      selectedDate && day.date.toDateString() === selectedDate.toDateString();
    const isToday = day.date.toDateString() === new Date().toDateString();

    return (
      <TouchableOpacity
        key={`day-${day.globalIndex}`}
        style={[
          styles.dayCell,
          !day.isCurrentMonth && styles.dayCellOtherMonth,
          isSelected && styles.dayCellSelected,
          isToday && styles.dayCellToday,
        ]}
        onPress={() => handleDayPress(day)}
        disabled={!day.isCurrentMonth}
      >
        <TextView
          style={[
            styles.dayNumber,
            !day.isCurrentMonth && styles.dayNumberOtherMonth,
            isSelected && styles.dayNumberSelected,
          ]}
        >
          {day.dayNumber > 0 ? day.dayNumber.toString().padStart(2, "0") : ""}
        </TextView>
      </TouchableOpacity>
    );
  };

  const renderWeek = (week: WeekData) => {
    const maxRow =
      week.taskBars.length > 0
        ? Math.max(...week.taskBars.map((b) => b.row)) + 1
        : 0;
    const taskAreaHeight = maxRow * (TASK_BAR_HEIGHT + TASK_BAR_GAP);

    return (
      <View key={`week-${week.weekIndex}`} style={styles.weekContainer}>
        {/* Day numbers row */}
        <View style={styles.weekRow}>
          {week.days.map((day) => renderDay(day))}
        </View>

        {/* Task bars overlay */}
        {taskAreaHeight > 0 && (
          <View style={[styles.taskBarsContainer, { height: taskAreaHeight }]}>
            {week.taskBars.map(renderTaskBar)}
          </View>
        )}
      </View>
    );
  };

  const renderMonth = (monthData: MonthData) => {
    return (
      <View
        key={`${monthData.year}-${monthData.month}`}
        style={styles.monthContainer}
      >
        {/* Month header */}
        <TextView style={styles.monthTitle}>
          {MONTHS[monthData.month]} {monthData.year}
        </TextView>

        {/* Weekday headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day) => (
            <View key={day} style={styles.weekdayCell}>
              <TextView style={styles.weekdayText}>{day}</TextView>
            </View>
          ))}
        </View>

        {/* Weeks */}
        {monthData.weeks.map(renderWeek)}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {months.map(renderMonth)}
    </ScrollView>
  );
};

// Types
interface MonthData {
  month: number;
  year: number;
  weeks: WeekData[];
}

// Generate month data with task positioning
function generateMonthData(date: Date, tasks: Task[]): MonthData {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Generate all days for the calendar grid
  const days: CalendarDay[] = [];
  let globalIndex = 0;

  // Add days from previous month to fill first week
  const startDayOfWeek = firstDay.getDay();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i);
    days.push({
      date: prevDate,
      dayNumber: prevDate.getDate(),
      isCurrentMonth: false,
      globalIndex: globalIndex++,
    });
  }

  // Add days of current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const currentDate = new Date(year, month, d);
    days.push({
      date: currentDate,
      dayNumber: d,
      isCurrentMonth: true,
      globalIndex: globalIndex++,
    });
  }

  // Add days from next month to complete last week
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        dayNumber: nextDate.getDate(),
        isCurrentMonth: false,
        globalIndex: globalIndex++,
      });
    }
  }

  // Calculate task positions for the entire month
  const taskPositions = calculateTaskPositions(tasks, days);

  // Split into weeks and assign task bars
  const weeks: WeekData[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7);
    const weekIndex = i / 7;
    const weekStartIndex = i;
    const weekEndIndex = i + 6;

    // Find task bars that overlap with this week
    const taskBars: TaskBarData[] = [];

    taskPositions.forEach((pos) => {
      if (pos.endIndex >= weekStartIndex && pos.startIndex <= weekEndIndex) {
        // This task overlaps with this week
        const startCol = Math.max(0, pos.startIndex - weekStartIndex);
        const endCol = Math.min(6, pos.endIndex - weekStartIndex);

        taskBars.push({
          task: pos.task,
          startCol,
          endCol,
          row: pos.row,
          isStart: pos.startIndex >= weekStartIndex,
          isEnd: pos.endIndex <= weekEndIndex,
        });
      }
    });

    weeks.push({
      days: weekDays,
      weekIndex,
      taskBars,
    });
  }

  return { month, year, weeks };
}

// Calculate task positions avoiding overlaps
function calculateTaskPositions(
  tasks: Task[],
  days: CalendarDay[],
): TaskPosition[] {
  const positions: TaskPosition[] = [];
  const rowOccupancy: Map<number, number[]> = new Map(); // globalIndex -> occupied rows

  // Filter and sort tasks
  const validTasks = tasks
    .map((task) => {
      const startDate = parseDate(task.startDate);
      const endDate = parseDate(task.endDate);
      if (!startDate || !endDate) return null;

      // Find indices in days array
      let startIndex = -1;
      let endIndex = -1;

      for (let i = 0; i < days.length; i++) {
        const dayDate = normalizeDate(days[i].date);
        const taskStart = normalizeDate(startDate);
        const taskEnd = normalizeDate(endDate);

        if (startIndex === -1 && dayDate >= taskStart) {
          startIndex = i;
        }
        if (dayDate <= taskEnd) {
          endIndex = i;
        }
      }

      // Handle tasks that start before the grid
      if (
        startIndex === -1 &&
        normalizeDate(startDate) < normalizeDate(days[0].date)
      ) {
        startIndex = 0;
      }

      if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        return null;
      }

      return { task, startIndex, endIndex };
    })
    .filter(
      (t): t is { task: Task; startIndex: number; endIndex: number } =>
        t !== null,
    );

  // Sort by start date, then by duration (longer first)
  validTasks.sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex;
    }
    const aDuration = a.endIndex - a.startIndex;
    const bDuration = b.endIndex - b.startIndex;
    return bDuration - aDuration;
  });

  // Assign rows
  validTasks.forEach(({ task, startIndex, endIndex }) => {
    let row = 0;
    let foundRow = false;

    while (!foundRow) {
      let rowAvailable = true;

      for (let i = startIndex; i <= endIndex; i++) {
        const occupiedRows = rowOccupancy.get(i) || [];
        if (occupiedRows.includes(row)) {
          rowAvailable = false;
          break;
        }
      }

      if (rowAvailable) {
        foundRow = true;
      } else {
        row++;
      }
    }

    // Mark days as occupied
    for (let i = startIndex; i <= endIndex; i++) {
      const occupiedRows = rowOccupancy.get(i) || [];
      occupiedRows.push(row);
      rowOccupancy.set(i, occupiedRows);
    }

    positions.push({ task, startIndex, endIndex, row });
  });

  return positions;
}

// Normalize date to midnight
function normalizeDate(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

// Parse date string "DD MMM YYYY"
function parseDate(dateStr: string): Date | null {
  try {
    const parts = dateStr.split(" ");
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    const year = parseInt(parts[2], 10);

    const monthIndex = MONTHS.findIndex((m) =>
      m.toLowerCase().startsWith(monthStr.toLowerCase()),
    );

    if (monthIndex === -1) return null;

    return new Date(year, monthIndex, day);
  } catch {
    return null;
  }
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    contentContainer: {
      padding: spacing.sm,
    },
    monthContainer: {
      marginBottom: spacing.lg,
    },
    monthTitle: {
      fontSize: FontSizes.lg,
      fontWeight: FontWeights.semiBold,
      color: colors.lightGreen,
      marginBottom: spacing.sm,
    },
    weekdayRow: {
      flexDirection: "row",
    },
    weekdayCell: {
      width: DAY_WIDTH,
      alignItems: "center",
      paddingVertical: spacing.xxs,
    },
    weekdayText: {
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.medium,
      color: theme.secondary,
    },
    weekContainer: {
      position: "relative",
    },
    weekRow: {
      flexDirection: "row",
    },
    dayCell: {
      width: DAY_WIDTH,
      height: DAY_NUMBER_HEIGHT,
      justifyContent: "flex-start",
      alignItems: "flex-end",
      paddingRight: 4,
      paddingTop: 2,
      borderTopWidth: 0.5,
      borderLeftWidth: 0.5,
      borderColor: theme.border,
    },
    dayCellOtherMonth: {
      backgroundColor: theme.primary,
    },
    dayCellSelected: {
      backgroundColor: `${colors.lightGreen}20`,
    },
    dayCellToday: {
      borderWidth: 2,
      borderColor: colors.lightGreen,
    },
    dayNumber: {
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.medium,
      color: theme.text,
    },
    dayNumberOtherMonth: {
      color: theme.secondary,
      opacity: 0.5,
    },
    dayNumberSelected: {
      color: colors.lightGreen,
      fontWeight: FontWeights.bold,
    },
    taskBarsContainer: {
      position: "relative",
      width: "100%",
    },
    taskBar: {
      position: "absolute",
      height: TASK_BAR_HEIGHT,
      backgroundColor: `${colors.lightGreen}50`,
      justifyContent: "center",
      paddingHorizontal: 3,
      overflow: "hidden",
    },
    taskBarText: {
      fontSize: 8,
      color: colors.darkGreen,
      fontWeight: FontWeights.medium,
    },
  });

export default ScheduleCalendarView;
