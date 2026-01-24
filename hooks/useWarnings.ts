'use client';

import { useMemo, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';

export interface Warning {
  id: string;
  conditionType: string;
  conditionValue: string;
  warningText: string;
  severity: 'info' | 'warning' | 'critical';
  nzbcRef?: string | null;
}

interface UserContext {
  windZone?: string | null;
  corrosionZone?: string | null;
  pitch?: number;
}

interface UseWarningsOptions {
  pitch?: number;
}

interface UseWarningsReturn {
  userContext: UserContext;
  getActiveWarnings: (warnings: Warning[]) => Warning[];
  getAllWarningsWithStatus: (warnings: Warning[]) => Array<Warning & { isActive: boolean }>;
  hasWarnings: (warnings: Warning[]) => boolean;
  hasCriticalWarnings: (warnings: Warning[]) => boolean;
  getActiveWarningCount: (warnings: Warning[]) => number;
  isWarningActive: (warning: Warning) => boolean;
}

export function useWarnings(options: UseWarningsOptions = {}): UseWarningsReturn {
  const { preferences } = useAppStore();

  const userContext: UserContext = useMemo(() => ({
    windZone: preferences.windZone,
    corrosionZone: preferences.corrosionZone,
    pitch: options.pitch,
  }), [preferences.windZone, preferences.corrosionZone, options.pitch]);

  // Check if a single warning is active based on user context
  const isWarningActive = useCallback((warning: Warning): boolean => {
    const { conditionType, conditionValue } = warning;

    switch (conditionType) {
      case 'wind_zone':
        // Warning is active if user's wind zone matches or is higher risk
        if (!userContext.windZone) return false;
        return matchesWindZone(userContext.windZone, conditionValue);

      case 'corrosion_zone':
        // Warning is active if user's corrosion zone matches or is higher risk
        if (!userContext.corrosionZone) return false;
        return matchesCorrosionZone(userContext.corrosionZone, conditionValue);

      case 'pitch':
        // Warning is active if pitch is below/above threshold
        if (userContext.pitch === undefined) return true; // Show by default if no pitch set
        return matchesPitchCondition(userContext.pitch, conditionValue);

      case 'exposure':
        // Always show exposure warnings
        return true;

      default:
        // For unknown condition types, always show the warning
        return true;
    }
  }, [userContext]);

  // Get only active warnings
  const getActiveWarnings = useCallback((warnings: Warning[]): Warning[] => {
    return warnings.filter(isWarningActive);
  }, [isWarningActive]);

  // Get all warnings with their active status
  const getAllWarningsWithStatus = useCallback(
    (warnings: Warning[]): Array<Warning & { isActive: boolean }> => {
      return warnings.map((warning) => ({
        ...warning,
        isActive: isWarningActive(warning),
      }));
    },
    [isWarningActive]
  );

  // Check if there are any active warnings
  const hasWarnings = useCallback((warnings: Warning[]): boolean => {
    return getActiveWarnings(warnings).length > 0;
  }, [getActiveWarnings]);

  // Check if there are critical active warnings
  const hasCriticalWarnings = useCallback((warnings: Warning[]): boolean => {
    return getActiveWarnings(warnings).some((w) => w.severity === 'critical');
  }, [getActiveWarnings]);

  // Get count of active warnings
  const getActiveWarningCount = useCallback((warnings: Warning[]): number => {
    return getActiveWarnings(warnings).length;
  }, [getActiveWarnings]);

  return {
    userContext,
    getActiveWarnings,
    getAllWarningsWithStatus,
    hasWarnings,
    hasCriticalWarnings,
    getActiveWarningCount,
    isWarningActive,
  };
}

// Helper functions for matching conditions

const WIND_ZONE_ORDER = ['low', 'medium', 'high', 'very-high', 'extra-high'];

function matchesWindZone(userZone: string, conditionZone: string): boolean {
  const userIndex = WIND_ZONE_ORDER.indexOf(userZone);
  const conditionIndex = WIND_ZONE_ORDER.indexOf(conditionZone);

  if (userIndex === -1 || conditionIndex === -1) {
    return userZone === conditionZone;
  }

  // Warning applies if user's zone is equal to or higher than the condition zone
  return userIndex >= conditionIndex;
}

const CORROSION_ZONE_ORDER = ['a', 'b', 'c', 'd', 'e'];

function matchesCorrosionZone(userZone: string, conditionZone: string): boolean {
  const userIndex = CORROSION_ZONE_ORDER.indexOf(userZone.toLowerCase());
  const conditionIndex = CORROSION_ZONE_ORDER.indexOf(conditionZone.toLowerCase());

  if (userIndex === -1 || conditionIndex === -1) {
    return userZone.toLowerCase() === conditionZone.toLowerCase();
  }

  // Warning applies if user's zone is equal to or more severe than the condition zone
  return userIndex >= conditionIndex;
}

function matchesPitchCondition(userPitch: number, condition: string): boolean {
  // Parse conditions like "< 15", "> 45", "<= 10", ">= 35"
  const match = condition.match(/^([<>]=?)\s*(\d+)$/);
  if (!match) {
    // Try exact match
    const exactMatch = condition.match(/^(\d+)$/);
    if (exactMatch) {
      return userPitch === parseInt(exactMatch[1], 10);
    }
    return true; // Unknown format, show warning
  }

  const [, operator, valueStr] = match;
  const value = parseInt(valueStr, 10);

  switch (operator) {
    case '<':
      return userPitch < value;
    case '<=':
      return userPitch <= value;
    case '>':
      return userPitch > value;
    case '>=':
      return userPitch >= value;
    default:
      return true;
  }
}
