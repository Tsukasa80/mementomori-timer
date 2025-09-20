import { StorageAdapter } from '../storage'
import { DayRecord, Settings, AppData, AppDataSchema, SettingsSchema, DayRecordSchema } from '../schema'

// ローカルストレージのキー
const SETTINGS_KEY = 'mementomori_settings'
const RECORDS_KEY = 'mementomori_records'
const VERSION = '1.0.0'

export class LocalStorageAdapter implements StorageAdapter {
  // ブラウザ環境かどうかをチェック
  private isClient(): boolean {
    return typeof window !== 'undefined'
  }

  // 設定を取得
  async getSettings(): Promise<Settings | null> {
    if (!this.isClient()) return null

    try {
      const data = localStorage.getItem(SETTINGS_KEY)
      if (!data) return null

      const parsed = JSON.parse(data)
      return SettingsSchema.parse(parsed)
    } catch (error) {
      console.error('設定の読み込みに失敗:', error)
      return null
    }
  }

  // 設定を保存
  async setSettings(settings: Settings): Promise<void> {
    if (!this.isClient()) return

    try {
      const validated = SettingsSchema.parse(settings)
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(validated))
    } catch (error) {
      console.error('設定の保存に失敗:', error)
      throw error
    }
  }

  // 日次記録を取得
  async getDayRecord(date: string): Promise<DayRecord | null> {
    if (!this.isClient()) return null

    try {
      const allRecords = await this.getAllDayRecords()
      return allRecords.find(record => record.date === date) || null
    } catch (error) {
      console.error('記録の読み込みに失敗:', error)
      return null
    }
  }

  // 日次記録を保存
  async setDayRecord(record: DayRecord): Promise<void> {
    if (!this.isClient()) return

    try {
      const validated = DayRecordSchema.parse(record)
      const allRecords = await this.getAllDayRecords()

      // 既存の記録を更新または新規追加
      const existingIndex = allRecords.findIndex(r => r.date === validated.date)
      if (existingIndex >= 0) {
        allRecords[existingIndex] = validated
      } else {
        allRecords.push(validated)
      }

      // 日付順にソート
      allRecords.sort((a, b) => a.date.localeCompare(b.date))

      localStorage.setItem(RECORDS_KEY, JSON.stringify(allRecords))
    } catch (error) {
      console.error('記録の保存に失敗:', error)
      throw error
    }
  }

  // 全日次記録を取得
  async getAllDayRecords(): Promise<DayRecord[]> {
    if (!this.isClient()) return []

    try {
      const data = localStorage.getItem(RECORDS_KEY)
      if (!data) return []

      const parsed = JSON.parse(data)
      if (!Array.isArray(parsed)) return []

      // 各記録を検証
      return parsed
        .map(record => {
          try {
            return DayRecordSchema.parse(record)
          } catch {
            return null
          }
        })
        .filter((record): record is DayRecord => record !== null)
        .sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      console.error('全記録の読み込みに失敗:', error)
      return []
    }
  }

  // 全データをエクスポート
  async exportData(): Promise<AppData> {
    try {
      const settings = await this.getSettings()
      const records = await this.getAllDayRecords()

      const data: AppData = {
        settings: settings || { targetDate: '' },
        records,
        version: VERSION,
      }

      return AppDataSchema.parse(data)
    } catch (error) {
      console.error('データのエクスポートに失敗:', error)
      throw error
    }
  }

  // データをインポート
  async importData(data: AppData): Promise<void> {
    if (!this.isClient()) return

    try {
      const validated = AppDataSchema.parse(data)

      // 設定を保存
      await this.setSettings(validated.settings)

      // 記録を保存（既存データは上書き）
      if (validated.records.length > 0) {
        localStorage.setItem(RECORDS_KEY, JSON.stringify(validated.records))
      }
    } catch (error) {
      console.error('データのインポートに失敗:', error)
      throw error
    }
  }

  // 全データを削除
  async clearData(): Promise<void> {
    if (!this.isClient()) return

    try {
      localStorage.removeItem(SETTINGS_KEY)
      localStorage.removeItem(RECORDS_KEY)
    } catch (error) {
      console.error('データの削除に失敗:', error)
      throw error
    }
  }
}