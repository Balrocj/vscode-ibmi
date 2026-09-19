import { l10n } from "vscode";
import IBMi from "./IBMi";
import { ConnectionConfig, LibraryListPreset } from "./configuration/config/types";

const DEFAULT_PRESET_NAME = `Default`;

export interface LibraryListDefaults {
  currentLibrary?: string
  libraryList: string[]
}

export function ensureLibraryListPresets(config: ConnectionConfig, defaults: LibraryListDefaults): LibraryListPreset[] {
  if (config.libraryListPresets.length === 0) {
    config.libraryListPresets = [{
      name: DEFAULT_PRESET_NAME,
      currentLibrary: config.currentLibrary ?? defaults.currentLibrary,
      libraryList: config.libraryList.length ? [...config.libraryList] : [...defaults.libraryList]
    }];
  }

  if (!config.activeLibraryListPreset || !findLibraryListPreset(config, config.activeLibraryListPreset)) {
    config.activeLibraryListPreset = config.libraryListPresets[0].name;
  }

  return config.libraryListPresets;
}

export function findLibraryListPreset(config: ConnectionConfig, name: string) {
  return config.libraryListPresets.find(preset => preset.name.localeCompare(name, undefined, { sensitivity: `accent` }) === 0);
}

export function createLibraryListPreset(config: ConnectionConfig, name: string, defaults: LibraryListDefaults) {
  validatePresetName(config, name);

  const preset: LibraryListPreset = {
    name: name.trim(),
    currentLibrary: defaults.currentLibrary,
    libraryList: [...defaults.libraryList]
  };

  config.libraryListPresets.push(preset);
  activateLibraryListPreset(config, preset.name);
  return preset;
}

export function renameLibraryListPreset(config: ConnectionConfig, preset: LibraryListPreset, name: string) {
  validatePresetName(config, name, preset.name);
  const newName = name.trim();

  if (config.activeLibraryListPreset === preset.name) {
    config.activeLibraryListPreset = newName;
  }

  preset.name = newName;
}

export function duplicateLibraryListPreset(config: ConnectionConfig, preset: LibraryListPreset, name: string) {
  validatePresetName(config, name);

  const duplicate: LibraryListPreset = {
    name: name.trim(),
    currentLibrary: preset.currentLibrary,
    libraryList: [...preset.libraryList]
  };

  config.libraryListPresets.push(duplicate);
  return duplicate;
}

export function deleteLibraryListPreset(config: ConnectionConfig, preset: LibraryListPreset) {
  if (config.libraryListPresets.length === 1) {
    throw new Error(l10n.t(`At least one library list must remain.`));
  }

  const index = config.libraryListPresets.indexOf(preset);
  if (index < 0) {
    throw new Error(l10n.t(`Library list {0} was not found.`, preset.name));
  }

  config.libraryListPresets.splice(index, 1);

  if (config.activeLibraryListPreset === preset.name) {
    activateLibraryListPreset(config, config.libraryListPresets[0].name);
  }
}

export function activateLibraryListPreset(config: ConnectionConfig, name: string) {
  const preset = findLibraryListPreset(config, name);
  if (!preset) {
    throw new Error(l10n.t(`Library list {0} was not found.`, name));
  }

  config.activeLibraryListPreset = preset.name;
  config.currentLibrary = preset.currentLibrary;
  config.libraryList = [...preset.libraryList];
  return preset;
}

export function saveActiveLibraryListPreset(config: ConnectionConfig) {
  const preset = config.activeLibraryListPreset && findLibraryListPreset(config, config.activeLibraryListPreset);
  if (preset) {
    preset.currentLibrary = config.currentLibrary;
    preset.libraryList = [...config.libraryList];
  }
}

export async function persistLibraryListPresets(config: ConnectionConfig) {
  await IBMi.connectionManager.update(config);
}

function validatePresetName(config: ConnectionConfig, name: string, currentName?: string) {
  const newName = name.trim();
  if (!newName) {
    throw new Error(l10n.t(`Library list name cannot be empty.`));
  }

  const existingPreset = findLibraryListPreset(config, newName);
  if (existingPreset && existingPreset.name !== currentName) {
    throw new Error(l10n.t(`A library list named {0} already exists.`, newName));
  }
}