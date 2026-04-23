/**
 * Показ сообщения пользователю в Mini App. Если нативного API нет (браузер, старый клиент) - window.alert.
 */
export function showTelegramAlert(message: string, onClose?: () => void): void {
  const tg = window.Telegram?.WebApp
  if (typeof tg?.showAlert === 'function') {
    tg.showAlert(message, onClose)
    return
  }
  window.alert(message)
  onClose?.()
}
