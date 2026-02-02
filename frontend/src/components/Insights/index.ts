import { state } from '../../state'
import { fetchInsights } from '../../api'

export function renderInsightsView(): string {
  const i = state.insights
  const rows = i
    ? `
    <tr><td class="p-2 border">Total feedback</td><td class="p-2 border">${i.total_feedback_count}</td></tr>
    <tr><td class="p-2 border">Thumbs up</td><td class="p-2 border">${i.thumbs_up_count}</td></tr>
    <tr><td class="p-2 border">Thumbs down</td><td class="p-2 border">${i.thumbs_down_count}</td></tr>`
    : '<tr><td class="p-2 border" colspan="2">Loading…</td></tr>'
  return `
  <div class="mx-auto max-w-2xl p-4">
    <h2 class="text-xl font-semibold mb-4">Feedback insights</h2>
    <table class="w-full border border-gray-300 rounded overflow-hidden">
      <tbody>${rows}</tbody>
    </table>
  </div>`
}

export function refreshInsights(onRender: () => void): void {
  if (state.insights !== null) return
  fetchInsights().then((data) => {
    state.insights = data
    onRender()
  })
}
