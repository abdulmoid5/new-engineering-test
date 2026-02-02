import { state } from '../../state'
import { fetchInsights } from '../../api'

export function renderInsightsView(): string {
  const i = state.insights
  const total = i?.total_feedback_count ?? 0
  const up = i?.thumbs_up_count ?? 0
  const down = i?.thumbs_down_count ?? 0
  const upPct = total > 0 ? Math.round((up / total) * 100) : 0
  const downPct = total > 0 ? Math.round((down / total) * 100) : 0

  const content = i
    ? `
    <div class="border rounded bg-white divide-y">
      <div class="p-4 flex items-baseline justify-between gap-4">
        <span class="text-sm text-gray-500">Total feedback</span>
        <span class="text-lg font-semibold tabular-nums text-gray-900">${total}</span>
      </div>
      <div class="p-4 flex items-baseline justify-between gap-4 bg-green-50/50">
        <span class="text-sm text-gray-600">👍 Thumbs up</span>
        <span class="text-lg font-semibold tabular-nums text-gray-900">${up}${total > 0 ? ` <span class="text-sm font-normal text-gray-500">(${upPct}%)</span>` : ''}</span>
      </div>
      <div class="p-4 flex items-baseline justify-between gap-4 bg-red-50/50">
        <span class="text-sm text-gray-600">👎 Thumbs down</span>
        <span class="text-lg font-semibold tabular-nums text-gray-900">${down}${total > 0 ? ` <span class="text-sm font-normal text-gray-500">(${downPct}%)</span>` : ''}</span>
      </div>
    </div>
    <p class="text-sm text-gray-500 mt-4">Feedback is collected from thumbs up/down on AI replies in Chat.</p>`
    : `
    <div class="border rounded bg-white p-6 text-center text-gray-500">
      Loading insights…
    </div>`

  return `
  <div class="mx-auto max-w-5xl p-4">
    <h1 class="text-xl font-semibold text-gray-900 mb-1">Insights</h1>
    <p class="text-sm text-gray-500 mb-6">Summary of user feedback on AI responses.</p>
    <div class="max-w-md">${content}</div>
  </div>`
}

export function refreshInsights(onRender: () => void): void {
  if (state.insights !== null) return
  fetchInsights().then((data) => {
    state.insights = data
    onRender()
  })
}
