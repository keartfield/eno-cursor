export interface MenuTexts {
  tooltip: string;
  start: string;
  stop: string;
  settings: string;
  quit: string;
}

const MENU_TEXTS: MenuTexts = {
  tooltip: 'Eno Cursor',
  start: 'Start',
  stop: 'Stop',
  settings: 'Preferences...',
  quit: 'Quit'
};

export class ConfigLoader {
  private static instance: ConfigLoader;

  private constructor() {}

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  getMenuTexts(): MenuTexts {
    return MENU_TEXTS;
  }
}
