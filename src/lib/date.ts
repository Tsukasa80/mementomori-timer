/**
 * 日付関連のユーティリティ関数
 * Asia/Tokyo タイムゾーンを前提とする
 */
import { differenceInCalendarDays, format, parseISO } from 'date-fns'

// 日本時間での今日の日付を YYYY-MM-DD 形式で取得
export function getTodayInJST(): string {
  const now = new Date()
  const jstDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  return format(jstDate, 'yyyy-MM-dd')
}

// 指定された日付文字列から Date オブジェクトを作成（JST前提）
export function parseJSTDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// 残り日数を計算する関数
export function calculateRemainingDays(targetDateString: string): number {
  const today = getTodayInJST()
  const todayDate = parseJSTDate(today)
  const targetDate = parseJSTDate(targetDateString)

  // date-fnsのdifferenceInCalendarDaysを使用
  return differenceInCalendarDays(targetDate, todayDate)
}

// 経過日数を計算する関数
export function calculateElapsedDays(startDateString: string): number {
  const today = getTodayInJST()
  const todayDate = parseJSTDate(today)
  const startDate = parseJSTDate(startDateString)

  const diffTime = todayDate.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

// 進捗率を計算する関数（0-100の範囲）
export function calculateProgress(startDateString: string, targetDateString: string): number {
  const totalDays = calculateElapsedDays(startDateString) + calculateRemainingDays(targetDateString)
  const elapsedDays = calculateElapsedDays(startDateString)

  if (totalDays <= 0) return 0

  const progress = (elapsedDays / totalDays) * 100
  return Math.min(100, Math.max(0, progress))
}

// 日付文字列をフォーマットする関数
export function formatDateForDisplay(dateString: string): string {
  const date = parseJSTDate(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]

  return `${year}年${month}月${day}日（${dayOfWeek}）`
}

// うるう年かどうかを判定する関数
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

// 年月日が有効かどうかを検証する関数
export function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false

  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  return day >= 1 && day <= daysInMonth[month - 1]
}

// 日付文字列の妥当性を検証する関数
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false

  const [year, month, day] = dateString.split('-').map(Number)
  return isValidDate(year, month, day)
}

// 現在時刻のISO文字列を取得（JST）
export function getCurrentJSTISOString(): string {
  const now = new Date()
  const jstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  return jstTime.toISOString()
}