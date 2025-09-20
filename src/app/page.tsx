'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateRemainingDays, getTodayInJST, formatDateForDisplay } from '@/lib/date'
import { getSettings } from '@/lib/storage'
import { Settings } from '@/lib/schema'

export default function HomePage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [remainingDays, setRemainingDays] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currentSettings = await getSettings()
        setSettings(currentSettings)

        if (currentSettings.targetDate) {
          const days = calculateRemainingDays(currentSettings.targetDate)
          setRemainingDays(days)
        }
      } catch (error) {
        console.error('設定の読み込みに失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const today = getTodayInJST()

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
          <h1 className="text-2xl font-bold mb-4">Memento Mori Timer</h1>
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

  const isExpired = remainingDays !== null && remainingDays <= 0

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b p-4 text-center">
        <h1 className="text-lg font-bold text-gray-800">
          {isExpired ? (
            <span className="text-red-600">仮寿命を過ぎています</span>
          ) : (
            <>
              死ぬまであと <span className="text-3xl font-bold text-red-600" aria-live="polite">{remainingDays?.toLocaleString()}</span> 日
            </>
          )}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          ターゲット日：{formatDateForDisplay(settings.targetDate)}
        </p>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          {/* 残り日数の大きな表示 */}
          <div className="mb-8">
            <div className="text-6xl font-bold text-red-600 mb-2" aria-live="polite">
              {isExpired ? '0' : remainingDays?.toLocaleString()}
            </div>
            <p className="text-xl text-gray-700">日</p>
          </div>

          {/* 進捗バー */}
          {!isExpired && remainingDays !== null && (
            <div className="mb-8">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-red-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, 100 - (remainingDays / 36500) * 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">人生の進捗</p>
            </div>
          )}

          {/* 今日の記録へのショートカット */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/today?tab=morning')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              今日の朝の記録
            </button>
            <button
              onClick={() => router.push('/today?tab=evening')}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              今日の夜の記録
            </button>
          </div>
        </div>
      </div>

      {/* フッターナビゲーション */}
      <footer className="bg-white border-t p-4">
        <div className="flex justify-around max-w-md mx-auto">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 font-semibold"
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
            className="text-gray-600 hover:text-blue-600"
          >
            設定
          </button>
        </div>
      </footer>
    </div>
  )
}