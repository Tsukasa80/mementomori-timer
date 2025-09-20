'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAllDayRecords, getSettings } from '@/lib/storage'
import { formatDateForDisplay, calculateRemainingDays } from '@/lib/date'
import { DayRecord, Settings } from '@/lib/schema'

export default function LogPage() {
  const router = useRouter()
  const [records, setRecords] = useState<DayRecord[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'complete' | 'incomplete'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [recordsData, settingsData] = await Promise.all([
          getAllDayRecords(),
          getSettings(),
        ])
        setRecords(recordsData)
        setSettings(settingsData)
      } catch (error) {
        console.error('データの読み込みに失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // フィルタリング処理
  const filteredRecords = records.filter(record => {
    // 検索フィルタ
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const morningText = record.morning ?
        `${record.morning.answers.usage} ${record.morning.answers.regret} ${record.morning.answers.freeText || ''}` : ''
      const eveningText = record.evening ?
        `${record.evening.answers.mostVital} ${record.evening.answers.waste} ${record.evening.answers.tomorrow} ${record.evening.answers.freeText || ''}` : ''

      if (!morningText.toLowerCase().includes(searchLower) &&
          !eveningText.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // 完了状態フィルタ
    switch (filter) {
      case 'complete':
        return record.morning && record.evening
      case 'incomplete':
        return !record.morning || !record.evening
      default:
        return true
    }
  })

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

  const remainingDays = settings?.targetDate ? calculateRemainingDays(settings.targetDate) : null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b p-4 text-center">
        <h1 className="text-lg font-bold text-gray-800">記録一覧</h1>
        {remainingDays !== null && (
          <p className="text-sm text-gray-600 mt-1">
            {remainingDays <= 0 ? (
              <span className="text-red-600">仮寿命を過ぎています</span>
            ) : (
              <>死ぬまであと <span className="font-semibold text-red-600">{remainingDays.toLocaleString()}</span> 日</>
            )}
          </p>
        )}
      </header>

      {/* フィルタとサーチ */}
      <div className="bg-white border-b p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* 検索バー */}
          <div>
            <input
              type="text"
              placeholder="記録内容を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>

          {/* フィルタボタン */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              全て ({records.length})
            </button>
            <button
              onClick={() => setFilter('complete')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'complete'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              記入済み ({records.filter(r => r.morning && r.evening).length})
            </button>
            <button
              onClick={() => setFilter('incomplete')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'incomplete'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              未記入あり ({records.filter(r => !r.morning || !r.evening).length})
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchTerm ? '検索条件に一致する記録がありません' : '記録がありません'}
              </p>
              <button
                onClick={() => router.push('/today')}
                className="btn btn-primary"
              >
                今日の記録を作成
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.reverse().map((record) => (
                <RecordCard
                  key={record.date}
                  record={record}
                  onClick={() => router.push(`/today?date=${record.date}`)}
                />
              ))}
            </div>
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
            className="text-gray-600 hover:text-blue-600"
          >
            今日
          </button>
          <button
            onClick={() => router.push('/log')}
            className="text-blue-600 font-semibold"
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

// 記録カードコンポーネント
function RecordCard({ record, onClick }: { record: DayRecord; onClick: () => void }) {
  const hasMorning = !!record.morning
  const hasEvening = !!record.evening
  const isComplete = hasMorning && hasEvening

  return (
    <div
      className="card cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="card-body">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-800">
              {formatDateForDisplay(record.date)}
            </h3>
            <div className="flex gap-2 mt-1">
              <StatusBadge type="morning" hasRecord={hasMorning} />
              <StatusBadge type="evening" hasRecord={hasEvening} />
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            {isComplete && (
              <span className="text-green-600 font-medium">✓ 完了</span>
            )}
          </div>
        </div>

        {/* 朝の記録のプレビュー */}
        {hasMorning && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-blue-600 mb-1">朝の記録</h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              {record.morning!.answers.usage.slice(0, 100)}
              {record.morning!.answers.usage.length > 100 && '...'}
            </p>
          </div>
        )}

        {/* 夜の記録のプレビュー */}
        {hasEvening && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-indigo-600 mb-1">夜の記録</h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              {record.evening!.answers.mostVital.slice(0, 100)}
              {record.evening!.answers.mostVital.length > 100 && '...'}
            </p>
          </div>
        )}

        {/* 未記入の場合 */}
        {!hasMorning && !hasEvening && (
          <p className="text-sm text-gray-500 italic">未記入</p>
        )}

        {/* 更新日時 */}
        <div className="text-xs text-gray-400 mt-3 pt-3 border-t">
          {hasEvening && record.evening?.updatedAt && (
            <span>最終更新: {new Date(record.evening.updatedAt).toLocaleString('ja-JP')}</span>
          )}
          {!hasEvening && hasMorning && record.morning?.updatedAt && (
            <span>最終更新: {new Date(record.morning.updatedAt).toLocaleString('ja-JP')}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ステータスバッジコンポーネント
function StatusBadge({ type, hasRecord }: { type: 'morning' | 'evening'; hasRecord: boolean }) {
  const label = type === 'morning' ? '朝' : '夜'
  const colorClass = hasRecord
    ? (type === 'morning' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800')
    : 'bg-gray-100 text-gray-500'

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {label} {hasRecord ? '✓' : '○'}
    </span>
  )
}