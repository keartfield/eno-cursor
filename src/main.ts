import { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigLoader } from './config-loader';

// Hot reload for development
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')([
      path.join(__dirname, '../dist'),
      path.join(__dirname, '../renderer')
    ], {
      electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit',
      forceHardReset: false
    });
  } catch (error) {
    console.log('Electron reload not available in production');
  }
}

let mainWindow: BrowserWindow;
let overlayWindows: BrowserWindow[] = [];
let tray: Tray | null = null;
let isRunning = false;

// Initialize config loader
const configLoader = ConfigLoader.getInstance();

// Default values
const DEFAULT_INNER_SIZE = 650;
const DEFAULT_OUTER_SIZE = 1000;
const DEFAULT_INNER_COLOR = '#d0723b';
const DEFAULT_OUTER_COLOR = '#e74b4b';

// Minimum values (removed - no restrictions)
// const MIN_INNER_SIZE = 300;
// const MIN_OUTER_SIZE = 500;

let innerSize = DEFAULT_INNER_SIZE;
let outerSize = DEFAULT_OUTER_SIZE;
let innerColor = DEFAULT_INNER_COLOR;
let outerColor = DEFAULT_OUTER_COLOR;
let settingsWindow: BrowserWindow | null = null;

const settingsPath = path.join(app.getPath('userData'), 'eno-cursor-settings.json');

interface Settings {
  inner: { size: number; color: string };
  outer: { size: number; color: string };
  running: boolean;
}

function loadSettings(): void {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const settings: Settings = JSON.parse(data);
      
      innerSize = settings.inner.size;
      outerSize = settings.outer.size;
      innerColor = settings.inner.color;
      outerColor = settings.outer.color;
      // Always start with isRunning = false on app startup
      isRunning = false;
      
      console.log('Settings loaded:', settings);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

function saveSettings(): void {
  try {
    const settings: Settings = {
      inner: { size: innerSize, color: innerColor },
      outer: { size: outerSize, color: outerColor },
      running: isRunning
    };
    
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log('Settings saved:', settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

function createTray(): void {
  // Hide dock icon since this is a menu bar app
  app.dock.hide();
  
  // Create a high-resolution bitmap icon (32x32 downscaled to 16x16)
  const iconSize = 32;
  const canvas = Buffer.alloc(iconSize * iconSize * 4); // RGBA buffer
  
  // Anti-aliased circle drawing function with subpixel sampling
  function setPixel(x: number, y: number, alpha: number) {
    if (x >= 0 && x < iconSize && y >= 0 && y < iconSize) {
      const index = Math.floor((Math.floor(y) * iconSize + Math.floor(x)) * 4);
      if (index >= 0 && index < canvas.length - 3) {
        canvas[index] = 0;     // R
        canvas[index + 1] = 0; // G
        canvas[index + 2] = 0; // B
        canvas[index + 3] = Math.min(255, Math.max(0, Math.floor(alpha * 255))); // A
      }
    }
  }
  
  // Draw high-resolution anti-aliased circles
  const centerX = iconSize / 2;
  const centerY = iconSize / 2;
  
  for (let y = 0; y < iconSize; y++) {
    for (let x = 0; x < iconSize; x++) {
      let totalAlpha = 0;
      const samples = 4; // 4x4 subpixel sampling
      
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const sampleX = x + (sx + 0.5) / samples - 0.5;
          const sampleY = y + (sy + 0.5) / samples - 0.5;
          const distance = Math.sqrt((sampleX - centerX) ** 2 + (sampleY - centerY) ** 2);
          
          // Outer circle (radius 13, thickness 2.5)
          const outerDist = Math.abs(distance - 13);
          if (outerDist < 1.5) {
            totalAlpha += Math.max(0, 1 - outerDist / 1.5);
          }
          
          // Inner circle (radius 6, thickness 2.5)  
          const innerDist = Math.abs(distance - 6);
          if (innerDist < 1.5) {
            totalAlpha += Math.max(0, 1 - innerDist / 1.5);
          }
        }
      }
      
      if (totalAlpha > 0) {
        setPixel(x, y, Math.min(1, totalAlpha / (samples * samples)));
      }
    }
  }
  
  const highResIcon = nativeImage.createFromBuffer(canvas, { width: iconSize, height: iconSize });
  const icon = highResIcon.resize({ width: 16, height: 16 });
  icon.setTemplateImage(true); // Makes it adapt to dark/light menu bar
  
  tray = new Tray(icon);
  tray.setToolTip(configLoader.getMenuTexts().tooltip);
  
  updateTrayMenu();
  
  console.log('Menu bar icon created');
}

function createSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 480,
    height: 640,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 'Eno Cursor Settings',
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'sidebar',
    backgroundColor: '#232233'
  });

  settingsWindow.loadFile(path.join(__dirname, '../renderer/settings.html'));
  
  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function updateTrayMenu(): void {
  if (!tray) return;
  
  const menuTexts = configLoader.getMenuTexts();
  const contextMenu = Menu.buildFromTemplate([
    {
      label: isRunning ? menuTexts.stop : menuTexts.start,
      click: () => {
        toggleOverlay();
      }
    },
    {
      type: 'separator'
    },
    {
      label: menuTexts.settings,
      click: () => {
        createSettingsWindow();
      }
    },
    {
      type: 'separator'
    },
    {
      label: menuTexts.quit,
      click: () => {
        // Close all overlay windows first
        overlayWindows.forEach(window => {
          if (!window.isDestroyed()) {
            window.close();
          }
        });
        overlayWindows = [];
        
        // Destroy tray
        if (tray) {
          tray.destroy();
          tray = null;
        }
        
        // Force quit the app
        app.exit(0);
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

function toggleOverlay(): void {
  isRunning = !isRunning;
  overlayWindows.forEach(window => {
    if (isRunning) {
      window.show();
    } else {
      window.hide();
    }
  });
  
  // Update all settings windows with new status
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('status-updated', isRunning);
  }
  
  saveSettings();
  updateTrayMenu();
}

function updateCircleSize(type: 'inner' | 'outer', size: number): void {
  if (type === 'inner') {
    innerSize = Math.max(1, size); // Allow very small sizes, minimum 1px
    if (outerSize <= innerSize) {
      outerSize = Math.max(1, innerSize + 200);
    }
  } else {
    outerSize = Math.max(1, size); // Allow very small sizes, minimum 1px
    if (innerSize >= outerSize) {
      innerSize = Math.max(1, outerSize - 200);
    }
  }
  
  const sizes = { inner: innerSize, outer: outerSize };
  overlayWindows.forEach(window => {
    if (window && !window.isDestroyed()) {
      window.webContents.send('circle-sizes-updated', sizes);
    }
  });
  
  updateTrayMenu();
}

function createOverlayWindows(): void {
  // Get all displays
  const displays = screen.getAllDisplays();
  console.log(`Found ${displays.length} displays`);
  
  // Clear existing overlay windows
  overlayWindows.forEach(window => {
    if (!window.isDestroyed()) {
      window.close();
    }
  });
  overlayWindows = [];
  
  // Create overlay window for each display
  displays.forEach((display, index) => {
    const { width, height, x, y } = display.bounds;
    
    const overlayWindow = new BrowserWindow({
      width: width,
      height: height,
      x: x,
      y: y,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      focusable: false,
      show: false,
      hasShadow: false,
      fullscreenable: false,
      type: 'panel'
    });

    overlayWindow.loadFile(path.join(__dirname, '../renderer/overlay.html'));
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    
    // Set window level to appear above fullscreen apps
    if (process.platform === 'darwin') {
      overlayWindow.setAlwaysOnTop(true, 'screen-saver');
    } else {
      overlayWindow.setAlwaysOnTop(true);
    }
    
    // Store display info in window
    (overlayWindow as any).displayIndex = index;
    (overlayWindow as any).displayBounds = display.bounds;
    
    // Send display index to renderer process once it's ready
    overlayWindow.webContents.once('did-finish-load', () => {
      overlayWindow.webContents.send('set-display-index', index);
      
      // Send initial settings to overlay
      const initialSettings = {
        inner: innerSize,
        outer: outerSize,
        innerColor: innerColor,
        outerColor: outerColor
      };
      overlayWindow.webContents.send('circle-settings-updated', initialSettings);
    });
    
    overlayWindows.push(overlayWindow);
    console.log(`Created overlay window ${index + 1} for display at ${x},${y} (${width}x${height})`);
    
    // Hide overlay by default on startup
    if (!isRunning) {
      overlayWindow.hide();
    }
  });
}

app.whenReady().then(() => {
  loadSettings();
  createTray();
  createOverlayWindows();

  app.on('activate', () => {
    // On macOS, don't recreate windows when clicking dock icon
    // Just ensure tray is available
    if (!tray) {
      createTray();
    }
  });
  
  // Listen for display changes
  screen.on('display-added', () => {
    console.log('Display added, recreating overlay windows');
    createOverlayWindows();
  });
  
  screen.on('display-removed', () => {
    console.log('Display removed, recreating overlay windows');
    createOverlayWindows();
  });
  
  screen.on('display-metrics-changed', () => {
    console.log('Display metrics changed, recreating overlay windows');
    createOverlayWindows();
  });
});

app.on('window-all-closed', () => {
  // Don't quit the app when all windows are closed - keep running in tray
  // App will quit when user selects "終了" from tray menu
});

ipcMain.on('toggle-overlay', (event, show: boolean) => {
  overlayWindows.forEach(window => {
    if (show) {
      window.show();
    } else {
      window.hide();
    }
  });
});

ipcMain.on('quit-app', () => {
  app.quit();
});

ipcMain.handle('get-cursor-position', () => {
  const cursorPoint = screen.getCursorScreenPoint();
  const displays = screen.getAllDisplays();
  
  // Find which display the cursor is on
  const currentDisplay = displays.find(display => {
    const bounds = display.bounds;
    return cursorPoint.x >= bounds.x && 
           cursorPoint.x < bounds.x + bounds.width &&
           cursorPoint.y >= bounds.y && 
           cursorPoint.y < bounds.y + bounds.height;
  });
  
  return {
    x: cursorPoint.x,
    y: cursorPoint.y,
    displayId: currentDisplay ? currentDisplay.id : null,
    displayIndex: currentDisplay ? displays.indexOf(currentDisplay) : -1
  };
});

ipcMain.on('update-circle-sizes', (event, sizes) => {
  overlayWindows.forEach(window => {
    if (window && !window.isDestroyed()) {
      window.webContents.send('circle-sizes-updated', sizes);
    }
  });
});

ipcMain.handle('get-display-bounds', (event, displayIndex) => {
  const displays = screen.getAllDisplays();
  if (displayIndex >= 0 && displayIndex < displays.length) {
    return displays[displayIndex].bounds;
  }
  return null;
});

ipcMain.handle('get-current-settings', () => {
  return {
    inner: { size: innerSize, color: innerColor },
    outer: { size: outerSize, color: outerColor },
    running: isRunning
  };
});

ipcMain.on('update-circle-settings', (event, settings) => {
  console.log('Received update-circle-settings:', settings);
  
  if (settings.inner) {
    innerSize = settings.inner.size;
    innerColor = settings.inner.color;
    console.log('Updated inner settings:', { size: innerSize, color: innerColor });
  }
  if (settings.outer) {
    outerSize = settings.outer.size;
    outerColor = settings.outer.color;
    console.log('Updated outer settings:', { size: outerSize, color: outerColor });
  }
  
  const updateData = {
    inner: innerSize,
    outer: outerSize,
    innerColor: innerColor,
    outerColor: outerColor
  };
  
  console.log('Sending circle-settings-updated to overlay windows:', updateData);
  console.log('Number of overlay windows:', overlayWindows.length);
  
  overlayWindows.forEach((window, index) => {
    if (window && !window.isDestroyed()) {
      console.log(`Sending to overlay window ${index}`);
      window.webContents.send('circle-settings-updated', updateData);
    } else {
      console.log(`Overlay window ${index} is destroyed or null`);
    }
  });
  
  saveSettings();
  updateTrayMenu();
});

// Remove duplicate toggle-overlay handler - it's already defined above

ipcMain.on('reset-to-defaults', () => {
  console.log('Resetting to default settings');
  
  // Reset to default values
  innerSize = DEFAULT_INNER_SIZE;
  outerSize = DEFAULT_OUTER_SIZE;
  innerColor = DEFAULT_INNER_COLOR;
  outerColor = DEFAULT_OUTER_COLOR;
  
  const defaultSettings = {
    inner: innerSize,
    outer: outerSize,
    innerColor: innerColor,
    outerColor: outerColor
  };
  
  // Update all overlay windows
  overlayWindows.forEach(window => {
    if (window && !window.isDestroyed()) {
      window.webContents.send('circle-settings-updated', defaultSettings);
    }
  });
  
  // Update settings window if open
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('settings-reset', {
      inner: { size: innerSize, color: innerColor },
      outer: { size: outerSize, color: outerColor },
      running: isRunning
    });
  }
  
  saveSettings();
  updateTrayMenu();
});
