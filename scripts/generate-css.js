const fs = require('fs');
const path = require('path');

// TypeScriptの定数ファイルを読み込む（簡易パーサー）
function extractConstants() {
  const constantsPath = path.join(__dirname, '../src/main/shared/constants.ts');
  const content = fs.readFileSync(constantsPath, 'utf8');
  
  // 簡易的な定数抽出（本格的にはTypeScript ASTパーサーを使用）  
  const constants = {};
  
  // DEFAULT_VALUES
  const defaultValuesMatch = content.match(/export const DEFAULT_VALUES = \{([^}]+)\}/s);
  if (defaultValuesMatch) {
    const values = defaultValuesMatch[1];
    constants.INNER_SIZE = values.match(/INNER_SIZE:\s*(\d+)/)?.[1] || '650';
    constants.OUTER_SIZE = values.match(/OUTER_SIZE:\s*(\d+)/)?.[1] || '1000';
    constants.INNER_COLOR = values.match(/INNER_COLOR:\s*'([^']+)'/)?.[1] || '#d0723b';
    constants.OUTER_COLOR = values.match(/OUTER_COLOR:\s*'([^']+)'/)?.[1] || '#e74b4b';
  }
  
  // UI_COLORS
  const uiColorsMatch = content.match(/export const UI_COLORS = \{([^}]+)\}/s);
  if (uiColorsMatch) {
    const values = uiColorsMatch[1];
    constants.BACKGROUND = values.match(/BACKGROUND:\s*'([^']+)'/)?.[1] || '#232233';
    constants.SURFACE = values.match(/SURFACE:\s*'([^']+)'/)?.[1] || '#333343';
    constants.PRIMARY = values.match(/PRIMARY:\s*'([^']+)'/)?.[1] || '#8f89fa';
    constants.TEXT_PRIMARY = values.match(/TEXT_PRIMARY:\s*'([^']+)'/)?.[1] || '#fff';
    constants.TEXT_SECONDARY = values.match(/TEXT_SECONDARY:\s*'([^']+)'/)?.[1] || '#8b8aa0';
    constants.BORDER = values.match(/BORDER:\s*'([^']+)'/)?.[1] || 'rgba(139, 138, 160, 0.1)';
  }
  
  // CIRCLE_SETTINGS
  const circleSettingsMatch = content.match(/export const CIRCLE_SETTINGS = \{([^}]+)\}/s);
  if (circleSettingsMatch) {
    const values = circleSettingsMatch[1];
    constants.BORDER_WIDTH_INNER = values.match(/BORDER_WIDTH_INNER:\s*(\d+)/)?.[1] || '16';
    constants.BORDER_WIDTH_OUTER = values.match(/BORDER_WIDTH_OUTER:\s*(\d+)/)?.[1] || '60';
    constants.OPACITY = values.match(/OPACITY:\s*([\d.]+)/)?.[1] || '0.6';
  }
  
  // WINDOW_SETTINGS
  const windowSettingsMatch = content.match(/export const WINDOW_SETTINGS = \{([^}]+)\}/s);
  if (windowSettingsMatch) {
    const values = windowSettingsMatch[1];
    constants.SETTINGS_WIDTH = values.match(/SETTINGS_WIDTH:\s*(\d+)/)?.[1] || '480';
    constants.SETTINGS_HEIGHT = values.match(/SETTINGS_HEIGHT:\s*(\d+)/)?.[1] || '640';
  }
  
  return constants;
}

// CSS変数を生成
function generateCSS(constants) {
  return `/* Generated from constants.ts - DO NOT EDIT MANUALLY */
:root {
  /* Default Values */
  --default-inner-size: ${constants.INNER_SIZE}px;
  --default-outer-size: ${constants.OUTER_SIZE}px;
  --default-inner-color: ${constants.INNER_COLOR};
  --default-outer-color: ${constants.OUTER_COLOR};
  
  /* UI Colors */
  --color-background: ${constants.BACKGROUND};
  --color-surface: ${constants.SURFACE};
  --color-primary: ${constants.PRIMARY};
  --color-text-primary: ${constants.TEXT_PRIMARY};
  --color-text-secondary: ${constants.TEXT_SECONDARY};
  --color-border: ${constants.BORDER};
  
  /* Circle Settings */
  --circle-border-width-inner: ${constants.BORDER_WIDTH_INNER}px;
  --circle-border-width-outer: ${constants.BORDER_WIDTH_OUTER}px;
  --circle-opacity: ${constants.OPACITY};
  
  /* Window Settings */
  --window-settings-width: ${constants.SETTINGS_WIDTH}px;
  --window-settings-height: ${constants.SETTINGS_HEIGHT}px;
}

/* Default circle styles using constants */
.inner-circle {
  border-width: var(--circle-border-width-inner);
  border-style: solid;
  border-color: rgba(208, 114, 59, var(--circle-opacity));
  box-sizing: border-box;
}

.outer-circle {
  border-width: var(--circle-border-width-outer);
  border-style: solid;
  border-color: rgba(231, 75, 75, var(--circle-opacity));
  box-sizing: border-box;
}
`;
}

// メイン実行
function main() {
  try {
    const constants = extractConstants();
    const css = generateCSS(constants);
    
    // 出力ディレクトリを作成
    const outputDir = path.join(__dirname, '../src/renderer/shared/constants');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // CSS生成
    const outputPath = path.join(outputDir, 'constants.css');
    fs.writeFileSync(outputPath, css);
    
    console.log('✅ Generated CSS constants file:', outputPath);
    console.log('📊 Constants extracted:', Object.keys(constants).length);
  } catch (error) {
    console.error('❌ Failed to generate CSS:', error.message);
    process.exit(1);
  }
}

main();
