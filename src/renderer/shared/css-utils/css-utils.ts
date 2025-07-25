import { DEFAULT_VALUES, UI_COLORS, CIRCLE_SETTINGS } from '../constants/constants';

export function setCSSVariables() {
  const root = document.documentElement;
  
  // デフォルトカラー
  root.style.setProperty('--color-inner-default', DEFAULT_VALUES.INNER_COLOR);
  root.style.setProperty('--color-outer-default', DEFAULT_VALUES.OUTER_COLOR);
  
  // UIカラー
  root.style.setProperty('--color-background', UI_COLORS.BACKGROUND);
  root.style.setProperty('--color-surface', UI_COLORS.SURFACE);
  root.style.setProperty('--color-primary', UI_COLORS.PRIMARY);
  root.style.setProperty('--color-text-primary', UI_COLORS.TEXT_PRIMARY);
  root.style.setProperty('--color-text-secondary', UI_COLORS.TEXT_SECONDARY);
  root.style.setProperty('--color-border', UI_COLORS.BORDER);
  
  // サークル設定
  root.style.setProperty('--circle-border-width-inner', `${CIRCLE_SETTINGS.BORDER_WIDTH_INNER}px`);
  root.style.setProperty('--circle-border-width-outer', `${CIRCLE_SETTINGS.BORDER_WIDTH_OUTER}px`);
  root.style.setProperty('--circle-opacity', CIRCLE_SETTINGS.OPACITY.toString());
}

export function updateCircleColors(innerColor: string, outerColor: string) {
  const root = document.documentElement;
  
  // Convert hex to rgba with opacity
  const innerRgba = hexToRgba(innerColor, CIRCLE_SETTINGS.OPACITY);
  const outerRgba = hexToRgba(outerColor, CIRCLE_SETTINGS.OPACITY);
  
  root.style.setProperty('--color-inner-current', innerRgba);
  root.style.setProperty('--color-outer-current', outerRgba);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}