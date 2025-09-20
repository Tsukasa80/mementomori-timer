import { z } from 'zod'

// 朝の記録スキーマ
export const MorningRecordSchema = z.object({
  date: z.string(), // YYYY-MM-DD形式
  answers: z.object({
    usage: z.string().min(1, '記入が必要です'), // この1日を、何に使うか？
    regret: z.string().min(1, '記入が必要です'), // 後悔しないか？
    freeText: z.string().optional(), // 自由追記欄
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// 夜の記録スキーマ
export const EveningRecordSchema = z.object({
  date: z.string(), // YYYY-MM-DD形式
  answers: z.object({
    mostVital: z.string().min(1, '記入が必要です'), // 最も命を有効に使ったこと
    waste: z.string().min(1, '記入が必要です'), // 無駄にしたこと
    tomorrow: z.string().min(1, '記入が必要です'), // 明日への改善点
    freeText: z.string().optional(), // 自由追記欄
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// 1日の記録（朝と夜をまとめたもの）
export const DayRecordSchema = z.object({
  date: z.string(), // YYYY-MM-DD形式
  morning: MorningRecordSchema.optional(),
  evening: EveningRecordSchema.optional(),
})

// 設定スキーマ
export const SettingsSchema = z.object({
  targetDate: z.string().min(1, '仮寿命日を設定してください'), // YYYY-MM-DD形式
  passcode: z.string().optional(), // パスコード（オプション）
})

// 全データのスキーマ（エクスポート/インポート用）
export const AppDataSchema = z.object({
  settings: SettingsSchema,
  records: z.array(DayRecordSchema),
  version: z.string(),
})

// 型定義
export type MorningRecord = z.infer<typeof MorningRecordSchema>
export type EveningRecord = z.infer<typeof EveningRecordSchema>
export type DayRecord = z.infer<typeof DayRecordSchema>
export type Settings = z.infer<typeof SettingsSchema>
export type AppData = z.infer<typeof AppDataSchema>