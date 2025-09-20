'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getTodayInJST, calculateRemainingDays, formatDateForDisplay, getCurrentJSTISOString } from '@/lib/date'
import { getDayRecord, saveDayRecord, getSettings } from '@/lib/storage'
import { DayRecord, Settings } from '@/lib/schema'

// フォームのスキーマ
const MorningFormSchema = z.object({
  usage: z.string().max(2000, '2000文字以内で入力してください'),
  regret: z.string().max(2000, '2000文字以内で入力してください'),
  freeText: z.string().max(2000, '2000文字以内で入力してください').optional(),
})

const EveningFormSchema = z.object({
  mostVital: z.string().max(2000, '2000文字以内で入力してください'),
  waste: z.string().max(2000, '2000文字以内で入力してください'),
  tomorrow: z.string().max(2000, '2000文字以内で入力してください'),
  freeText: z.string().max(2000, '2000文字以内で入力してください').optional(),
})

type MorningFormData = z.infer<typeof MorningFormSchema>
type EveningFormData = z.infer<typeof EveningFormSchema>

function TodayPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning')
  const [dayRecord, setDayRecord] = useState<DayRecord | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const today = getTodayInJST()

  // 朝のフォーム
  const morningForm = useForm<MorningFormData>({
    resolver: zodResolver(MorningFormSchema),
    defaultValues: {
      usage: '',
      regret: '',
      freeText: '',
    },
  })

  // 夜のフォーム
  const eveningForm = useForm<EveningFormData>({
    resolver: zodResolver(EveningFormSchema),
    defaultValues: {
      mostVital: '',
      waste: '',
      tomorrow: '',
      freeText: '',
    },
  })

  // 初期データの読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        const [recordData, settingsData] = await Promise.all([
          getDayRecord(today),
          getSettings(),
        ])

        setDayRecord(recordData)
        setSettings(settingsData)

        // フォームのデフォルト値を設定
        if (recordData.morning) {
          morningForm.reset({
            usage: recordData.morning.answers.usage || '',
            regret: recordData.morning.answers.regret || '',
            freeText: recordData.morning.answers.freeText || '',
          })
        }

        if (recordData.evening) {
          eveningForm.reset({
            mostVital: recordData.evening.answers.mostVital || '',
            waste: recordData.evening.answers.waste || '',
            tomorrow: recordData.evening.answers.tomorrow || '',
            freeText: recordData.evening.answers.freeText || '',
          })
        }
      } catch (error) {
        console.error('データの読み込みに失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [today, morningForm, eveningForm])

  // URLパラメータからタブを設定
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'morning' || tab === 'evening') {
      setActiveTab(tab)
    }
  }, [searchParams])

  // 朝の記録を保存
  const saveMorningRecord = async (data: MorningFormData) => {
    if (!dayRecord) return

    setSaving(true)
    try {
      const now = getCurrentJSTISOString()
      const updatedRecord: DayRecord = {
        ...dayRecord,
        morning: {
          date: today,
          answers: {
            usage: data.usage,
            regret: data.regret,
            freeText: data.freeText || '',
          },
          createdAt: dayRecord.morning?.createdAt || now,
          updatedAt: now,
        },
      }

      await saveDayRecord(updatedRecord)
      setDayRecord(updatedRecord)
    } catch (error) {
      console.error('朝の記録の保存に失敗:', error)
      alert('保存に失敗しました。再度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  // 夜の記録を保存
  const saveEveningRecord = async (data: EveningFormData) => {
    if (!dayRecord) return

    setSaving(true)
    try {
      const now = getCurrentJSTISOString()
      const updatedRecord: DayRecord = {
        ...dayRecord,
        evening: {
          date: today,
          answers: {
            mostVital: data.mostVital,
            waste: data.waste,
            tomorrow: data.tomorrow,
            freeText: data.freeText || '',
          },
          createdAt: dayRecord.evening?.createdAt || now,
          updatedAt: now,
        },
      }

      await saveDayRecord(updatedRecord)
      setDayRecord(updatedRecord)
    } catch (error) {
      console.error('夜の記録の保存に失敗:', error)
      alert('保存に失敗しました。再度お試しください。')
    } finally {
      setSaving(false)
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

  if (!settings?.targetDate) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">設定が必要です</h1>
          <p className="text-gray-600 mb-6">
            まず設定ページで仮寿命日を設定してください。
          </p>
          <button
            onClick={() => router.push('/settings')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            設定ページへ
          </button>
        </div>
      </div>
    )
  }

  const remainingDays = calculateRemainingDays(settings.targetDate)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b p-4 text-center">
        <h1 className="text-lg font-bold text-gray-800">
          {remainingDays <= 0 ? (
            <span className="text-red-600">仮寿命を過ぎています</span>
          ) : (
            <>
              死ぬまであと <span className="text-2xl font-bold text-red-600">{remainingDays?.toLocaleString()}</span> 日
            </>
          )}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {formatDateForDisplay(today)}
        </p>
      </header>

      {/* タブナビゲーション */}
      <div className="bg-white border-b">
        <div className="tab-nav max-w-md mx-auto">
          <button
            className={activeTab === 'morning' ? 'active' : ''}
            onClick={() => setActiveTab('morning')}
          >
            朝の記録
          </button>
          <button
            className={activeTab === 'evening' ? 'active' : ''}
            onClick={() => setActiveTab('evening')}
          >
            夜の記録
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          {activeTab === 'morning' ? (
            <MorningForm
              form={morningForm}
              onSubmit={saveMorningRecord}
              saving={saving}
              hasRecord={!!dayRecord?.morning}
            />
          ) : (
            <EveningForm
              form={eveningForm}
              onSubmit={saveEveningRecord}
              saving={saving}
              hasRecord={!!dayRecord?.evening}
            />
          )}
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
            className="text-blue-600 font-semibold"
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
            className="text-gray-600 hover:text-blue-600"
          >
            設定
          </button>
        </div>
      </footer>
    </div>
  )
}

// 朝のフォームコンポーネント
function MorningForm({
  form,
  onSubmit,
  saving,
  hasRecord,
}: {
  form: any
  onSubmit: (data: MorningFormData) => void
  saving: boolean
  hasRecord: boolean
}) {
  const { register, handleSubmit, watch, formState: { errors } } = form
  const watchedValues = watch()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-800">朝の記録</h2>
          <p className="text-sm text-gray-600">1日の始まりに、今日をどう使うかを考えてみましょう</p>
        </div>
        <div className="card-body space-y-6">
          {/* この1日を、何に使うか？ */}
          <div className="form-group">
            <label htmlFor="usage" className="form-label">
              この1日を、何に使うか？
            </label>
            <textarea
              id="usage"
              {...register('usage')}
              placeholder="この日が人生最後だとしたら、誰に会う？今やってることは死ぬ直前の自分が喜ぶこと？"
              className="form-textarea"
              rows={4}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.usage && <p className="form-error">{errors.usage.message}</p>}
              <p className="text-sm text-gray-500 ml-auto">
                {watchedValues.usage?.length || 0}/2000
              </p>
            </div>
          </div>

          {/* 後悔しないか？ */}
          <div className="form-group">
            <label htmlFor="regret" className="form-label">
              後悔しないか？
            </label>
            <textarea
              id="regret"
              {...register('regret')}
              placeholder="残り○日のうち、この1日を何に投資したい？"
              className="form-textarea"
              rows={4}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.regret && <p className="form-error">{errors.regret.message}</p>}
              <p className="text-sm text-gray-500 ml-auto">
                {watchedValues.regret?.length || 0}/2000
              </p>
            </div>
          </div>

          {/* 自由追記欄 */}
          <div className="form-group">
            <label htmlFor="freeText" className="form-label">
              自由追記欄（任意）
            </label>
            <textarea
              id="freeText"
              {...register('freeText')}
              placeholder="その他、思ったことや感じたことを自由に記録してください"
              className="form-textarea"
              rows={3}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.freeText && <p className="form-error">{errors.freeText.message}</p>}
              <p className="text-sm text-gray-500 ml-auto">
                {watchedValues.freeText?.length || 0}/2000
              </p>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? '保存中...' : hasRecord ? '更新する' : '保存する'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

// 夜のフォームコンポーネント
function EveningForm({
  form,
  onSubmit,
  saving,
  hasRecord,
}: {
  form: any
  onSubmit: (data: EveningFormData) => void
  saving: boolean
  hasRecord: boolean
}) {
  const { register, handleSubmit, watch, formState: { errors } } = form
  const watchedValues = watch()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-800">夜の記録</h2>
          <p className="text-sm text-gray-600">1日を振り返り、明日への糧にしましょう</p>
        </div>
        <div className="card-body space-y-6">
          {/* 最も命を有効に使ったこと */}
          <div className="form-group">
            <label htmlFor="mostVital" className="form-label">
              今日、最も命を有効に使ったことは？
            </label>
            <textarea
              id="mostVital"
              {...register('mostVital')}
              placeholder="今日の行動のうち、最も価値があったと思うことを記録してください"
              className="form-textarea"
              rows={4}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.mostVital && <p className="form-error">{errors.mostVital.message}</p>}
              <p className="text-sm text-gray-500 ml-auto">
                {watchedValues.mostVital?.length || 0}/2000
              </p>
            </div>
          </div>

          {/* 無駄にしたこと */}
          <div className="form-group">
            <label htmlFor="waste" className="form-label">
              無駄にしたと思うことは？
            </label>
            <textarea
              id="waste"
              {...register('waste')}
              placeholder="時間や労力を無駄にしたと感じることがあれば記録してください"
              className="form-textarea"
              rows={4}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.waste && <p className="form-error">{errors.waste.message}</p>}
              <p className="text-sm text-gray-500 ml-auto">
                {watchedValues.waste?.length || 0}/2000
              </p>
            </div>
          </div>

          {/* 明日はどう過ごす？ */}
          <div className="form-group">
            <label htmlFor="tomorrow" className="form-label">
              明日はどう過ごす？
            </label>
            <textarea
              id="tomorrow"
              {...register('tomorrow')}
              placeholder="今日の反省を活かして、明日をどのように過ごしたいかを記録してください"
              className="form-textarea"
              rows={4}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.tomorrow && <p className="form-error">{errors.tomorrow.message}</p>}
              <p className="text-sm text-gray-500 ml-auto">
                {watchedValues.tomorrow?.length || 0}/2000
              </p>
            </div>
          </div>

          {/* 自由追記欄 */}
          <div className="form-group">
            <label htmlFor="freeText" className="form-label">
              自由追記欄（任意）
            </label>
            <textarea
              id="freeText"
              {...register('freeText')}
              placeholder="その他、思ったことや感じたことを自由に記録してください"
              className="form-textarea"
              rows={3}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.freeText && <p className="form-error">{errors.freeText.message}</p>}
              <p className="text-sm text-gray-500 ml-auto">
                {watchedValues.freeText?.length || 0}/2000
              </p>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? '保存中...' : hasRecord ? '更新する' : '保存する'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default function TodayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <TodayPageContent />
    </Suspense>
  )
}