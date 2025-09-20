import { DayRecord, Settings, AppData } from './schema'

// ストレージアダプタのインターフェース
export interface StorageAdapter {
  // 設定の読み書き
  getSettings(): Promise<Settings | null>
  setSettings(settings: Settings): Promise<void>

  // 日次記録の読み書き
  getDayRecord(date: string): Promise<DayRecord | null>
  setDayRecord(record: DayRecord): Promise<void>
  getAllDayRecords(): Promise<DayRecord[]>

  // 全データのエクスポート/インポート
  exportData(): Promise<AppData>
  importData(data: AppData): Promise<void>
  clearData(): Promise<void>
}

// 現在のストレージアダプタのインスタンス
let currentAdapter: StorageAdapter

// アダプタを初期化する関数
export function initializeStorage(): StorageAdapter {
  if (currentAdapter) {
    return currentAdapter
  }

  // 環境変数に基づいてアダプタを選択
  const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'

  if (useSupabase) {
    // Supabaseアダプタを使用（実装は後で追加）
    throw new Error('Supabaseアダプタはまだ実装されていません')
  } else {
    // ローカルストレージアダプタを使用
    const { LocalStorageAdapter } = require('./adapters/local')
    currentAdapter = new LocalStorageAdapter()
  }

  return currentAdapter
}

// ストレージアダプタを取得する関数
export function getStorageAdapter(): StorageAdapter {
  if (!currentAdapter) {
    return initializeStorage()
  }
  return currentAdapter
}

// 便利なユーティリティ関数群

// 設定を取得（デフォルト値付き）
export async function getSettings(): Promise<Settings> {
  const adapter = getStorageAdapter()
  const settings = await adapter.getSettings()

  // デフォルト設定
  if (!settings) {
    const defaultSettings: Settings = {
      targetDate: '', // 初期値は空文字
    }
    return defaultSettings
  }

  return settings
}

// 設定を保存
export async function saveSettings(settings: Settings): Promise<void> {
  const adapter = getStorageAdapter()
  await adapter.setSettings(settings)
}

// 指定日の記録を取得
export async function getDayRecord(date: string): Promise<DayRecord> {
  const adapter = getStorageAdapter()
  const record = await adapter.getDayRecord(date)

  // デフォルト記録
  if (!record) {
    return {
      date,
      morning: undefined,
      evening: undefined,
    }
  }

  return record
}

// 日次記録を保存
export async function saveDayRecord(record: DayRecord): Promise<void> {
  const adapter = getStorageAdapter()
  await adapter.setDayRecord(record)
}

// 全記録を取得
export async function getAllDayRecords(): Promise<DayRecord[]> {
  const adapter = getStorageAdapter()
  return await adapter.getAllDayRecords()
}

// データをエクスポート
export async function exportData(): Promise<AppData> {
  const adapter = getStorageAdapter()
  return await adapter.exportData()
}

// データをインポート
export async function importData(data: AppData): Promise<void> {
  const adapter = getStorageAdapter()
  await adapter.importData(data)
}

// 全データを削除
export async function clearAllData(): Promise<void> {
  const adapter = getStorageAdapter()
  await adapter.clearData()
}