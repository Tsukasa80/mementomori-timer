'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getSettings, saveSettings, exportData, importData, clearAllData } from '@/lib/storage'
import { isValidDateString, getTodayInJST, calculateRemainingDays, formatDateForDisplay } from '@/lib/date'
import { Settings, AppData, AppDataSchema } from '@/lib/schema'

// 設定フォームのスキーマ
const SettingsFormSchema = z.object({
  targetDate: z.string()
    .min(1, '仮寿命日を入力してください')
    .refine((date) => isValidDateString(date), '有効な日付を入力してください（YYYY-MM-DD）')
    .refine((date) => {
      const today = getTodayInJST()
      return date >= today
    }, '仮寿命日は今日以降の日付である必要があります'),
  passcode: z.string().optional(),
})

type SettingsFormData = z.infer<typeof SettingsFormSchema>

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDataSection, setShowDataSection] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(SettingsFormSchema),
    defaultValues: {
      targetDate: '',
      passcode: '',
    },
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form
  const watchedTargetDate = watch('targetDate')

  // 初期データの読み込み
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currentSettings = await getSettings()
        setSettings(currentSettings)

        if (currentSettings.targetDate) {
          setValue('targetDate', currentSettings.targetDate)
        }
        if (currentSettings.passcode) {
          setValue('passcode', currentSettings.passcode)
        }
      } catch (error) {
        console.error('設定の読み込みに失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [setValue])

  // 設定を保存
  const saveSettingsData = async (data: SettingsFormData) => {
    setSaving(true)
    try {
      const newSettings: Settings = {
        targetDate: data.targetDate,
        passcode: data.passcode || undefined,
      }

      await saveSettings(newSettings)
      setSettings(newSettings)
      alert('設定を保存しました')
    } catch (error) {
      console.error('設定の保存に失敗:', error)
      alert('保存に失敗しました。再度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  // データをエクスポート
  const handleExport = async () => {
    try {
      const data = await exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mementomori-backup-${getTodayInJST()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('エクスポートに失敗:', error)
      alert('エクスポートに失敗しました')
    }
  }

  // データをインポート
  const handleImport = async () => {
    if (!importFile) return

    try {
      const text = await importFile.text()
      const data = JSON.parse(text)
      const validatedData = AppDataSchema.parse(data)

      if (confirm('既存のデータは上書きされます。インポートを実行しますか？')) {
        await importData(validatedData)
        alert('データをインポートしました')
        window.location.reload()
      }
    } catch (error) {
      console.error('インポートに失敗:', error)
      alert('インポートに失敗しました。ファイル形式を確認してください。')
    }
  }

  // データを削除
  const handleClearData = async () => {
    if (confirm('全てのデータが削除されます。本当に実行しますか？')) {
      if (confirm('この操作は元に戻せません。本当に削除しますか？')) {
        try {
          await clearAllData()
          alert('データを削除しました')
          window.location.reload()
        } catch (error) {
          console.error('データの削除に失敗:', error)
          alert('削除に失敗しました')
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  const remainingDays = watchedTargetDate ? calculateRemainingDays(watchedTargetDate) : null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b p-4 text-center">
        <h1 className="text-lg font-bold text-gray-800">設定</h1>
        {settings?.targetDate && (
          <p className="text-sm text-gray-600 mt-1">
            現在の仮寿命日: {formatDateForDisplay(settings.targetDate)}
          </p>
        )}
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 基本設定 */}
          <form onSubmit={handleSubmit(saveSettingsData)}>
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold text-gray-800">基本設定</h2>
              </div>
              <div className="card-body space-y-6">
                {/* 仮寿命日 */}
                <div className="form-group">
                  <label htmlFor="targetDate" className="form-label">
                    仮寿命日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="targetDate"
                    type="date"
                    {...register('targetDate')}
                    className="form-input"
                    min={getTodayInJST()}
                  />
                  {errors.targetDate && (
                    <p className="form-error">{errors.targetDate.message}</p>
                  )}
                  {watchedTargetDate && !errors.targetDate && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-800">
                        {remainingDays !== null && remainingDays >= 0 ? (
                          <>
                            設定した日まで <span className="font-bold">{remainingDays.toLocaleString()}</span> 日です
                          </>
                        ) : (
                          <span className="text-red-600">過去の日付は設定できません</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* パスコード（オプション） */}
                <div className="form-group">
                  <label htmlFor="passcode" className="form-label">
                    パスコード（任意）
                  </label>
                  <input
                    id="passcode"
                    type="password"
                    {...register('passcode')}
                    placeholder="データ保護用のパスコード"
                    className="form-input"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    設定すると、アプリ起動時にパスコードの入力が必要になります（将来の機能）
                  </p>
                </div>

                {/* 保存ボタン */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? '保存中...' : '設定を保存'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* データ管理 */}
          <div className="card">
            <div className="card-header">
              <button
                onClick={() => setShowDataSection(!showDataSection)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="text-xl font-bold text-gray-800">データ管理</h2>
                <span className="text-gray-500">
                  {showDataSection ? '−' : '+'}
                </span>
              </button>
            </div>
            {showDataSection && (
              <div className="card-body space-y-6">
                {/* エクスポート */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">データのエクスポート</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    設定と記録データをJSONファイルでバックアップできます
                  </p>
                  <button
                    onClick={handleExport}
                    className="btn btn-secondary"
                  >
                    データをエクスポート
                  </button>
                </div>

                {/* インポート */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">データのインポート</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    エクスポートしたJSONファイルからデータを復元できます
                  </p>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="form-input"
                    />
                    <button
                      onClick={handleImport}
                      disabled={!importFile}
                      className="btn btn-secondary"
                    >
                      データをインポート
                    </button>
                  </div>
                </div>

                {/* データ削除 */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-red-600 mb-2">データの削除</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    全ての設定と記録データを削除します。この操作は元に戻せません。
                  </p>
                  <button
                    onClick={handleClearData}
                    className="btn btn-danger"
                  >
                    全データを削除
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* アプリ情報 */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-bold text-gray-800">アプリ情報</h2>
            </div>
            <div className="card-body">
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>アプリ名:</strong> Memento Mori Timer</p>
                <p><strong>バージョン:</strong> 1.0.0</p>
                <p><strong>データ保存:</strong> ブラウザ内のローカルストレージ</p>
                <p><strong>タイムゾーン:</strong> Asia/Tokyo</p>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>注意:</strong> データはこのブラウザ内にのみ保存されます。
                  ブラウザのデータを削除したり、別のデバイスでアクセスした場合、
                  データは失われます。定期的にエクスポートでバックアップを取ることをお勧めします。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* フッターナビゲーション */}
      <footer className="bg-white border-t p-4">
        <div className="flex justify-around max-w-md mx-auto">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-blue-600"
          >
            ホーム
          </button>
          <button
            onClick={() => router.push('/today')}
            className="text-gray-600 hover:text-blue-600"
          >
            今日
          </button>
          <button
            onClick={() => router.push('/log')}
            className="text-gray-600 hover:text-blue-600"
          >
            記録
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="text-blue-600 font-semibold"
          >
            設定
          </button>
        </div>
      </footer>
    </div>
  )
}