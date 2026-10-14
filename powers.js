// ---- Powers of 2 practice ---------------------------------------------
// Two drills:
//   "2ⁿ = ?"   shows 2^n, you type the value.
//   "closest"  shows a number, you type the n whose 2^n is nearest to it.
// Enter submits; Enter again moves to the next question.

const root = document.getElementById('pow2')

if (root) {
  const promptEl = root.querySelector('.pow2-prompt')
  const hintEl = root.querySelector('.pow2-hint')
  const form = root.querySelector('.pow2-form')
  const input = root.querySelector('.pow2-input')
  const submitBtn = root.querySelector('.pow2-submit')
  const feedbackEl = root.querySelector('.pow2-feedback')
  const tipEl = root.querySelector('.pow2-tip')
  const scoreEl = root.querySelector('.pow2-score')
  const modeBtns = Array.from(root.querySelectorAll('.pow2-mode button'))
  const maxSelect = root.querySelector('.pow2-max')
  const panel = root.closest('.panel')

  const fmt = (n) => n.toLocaleString('en-US')
  const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))
  const sup = (n) =>
    String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])

  let mode = 'value' // 'value' | 'closest'
  let current = null // { n, shown, accept: Set<string>, answerText }
  let answered = false
  let right = 0
  let total = 0
  let streak = 0
  let lastN = -1

  // Pick an exponent, avoiding an immediate repeat.
  function pickExponent(lo, hi) {
    let n
    do { n = randInt(lo, hi) } while (n === lastN && hi > lo)
    lastN = n
    return n
  }

  // Round to a couple of significant figures so numbers look like
  // "real" sizes (1,000,000 / 65,000 / 3,200) rather than random noise.
  function roundish(x) {
    if (x < 100) return Math.round(x)
    const digits = Math.floor(Math.log10(x)) + 1
    const keep = Math.random() < 0.5 ? 2 : 3
    const step = 10 ** (digits - keep)
    return Math.round(x / step) * step
  }

  // Exponent(s) whose power of 2 is nearest to x (linear distance).
  function closestExponents(x) {
    const lo = Math.floor(Math.log2(x))
    const dLo = x - 2 ** lo
    const dHi = 2 ** (lo + 1) - x
    if (dLo === dHi) return [lo, lo + 1]
    return [dLo < dHi ? lo : lo + 1]
  }

  const BIG = ['', 'thousand', 'million', 'billion', 'trillion']

  // How to work 2^n out in your head: 2^10 ≈ 1,000, then a small power.
  function valueTip(n) {
    if (n < 10) return `Small powers: just keep doubling from 1 — 1, 2, 4, 8, 16, 32, 64, 128, 256, 512.`
    const k = Math.floor(n / 10), r = n % 10
    const approx = r === 0 ? `≈ 1 ${BIG[k]}` : `≈ ${2 ** r} ${BIG[k]}`
    return `Split it: 2${sup(n)} = (2¹⁰)${sup(k)} × 2${sup(r)}. Since 2¹⁰ = 1,024 ≈ 1 thousand, that’s ${approx} — then the exact digits are slightly higher.`
  }

  // Why one power is closer than the other.
  function closestTip(x) {
    const lo = Math.floor(Math.log2(x))
    const mid = 1.5 * 2 ** lo
    return `It sits between 2${sup(lo)} = ${fmt(2 ** lo)} and 2${sup(lo + 1)} = ${fmt(2 ** (lo + 1))}. ` +
      `Halfway is 1.5 × 2${sup(lo)} = ${fmt(mid)}, so anything below that rounds down to ${lo}, above it rounds up to ${lo + 1}. ` +
      `Anchors: 2¹⁰ ≈ thousand, 2²⁰ ≈ million, 2³⁰ ≈ billion.`
  }

  function newQuestion() {
    const max = Number(maxSelect.value)
    answered = false
    feedbackEl.textContent = ''
    feedbackEl.className = 'pow2-feedback'
    tipEl.hidden = true
    input.value = ''
    submitBtn.textContent = 'Check'

    if (mode === 'value') {
      const n = pickExponent(0, max)
      current = {
        n,
        tip: valueTip(n),
        accept: new Set([String(2 ** n)]),
        answerText: `2${sup(n)} = ${fmt(2 ** n)}`,
      }
      promptEl.innerHTML = `2<sup>${n}</sup> = ?`
      hintEl.textContent = 'Type the value (commas optional).'
      input.inputMode = 'numeric'
      input.placeholder = 'value'
    } else {
      const n = pickExponent(2, max)
      // Land somewhere between roughly 2^(n-0.5) and 2^(n+0.5).
      let x = roundish(2 ** (n + (Math.random() - 0.5)))
      if (x < 3) x = 3
      const ns = closestExponents(x)
      current = {
        n: ns[0],
        tip: closestTip(x),
        accept: new Set(ns.map(String)),
        answerText: ns
          .map((k) => `2${sup(k)} = ${fmt(2 ** k)}`)
          .join('  or  '),
      }
      promptEl.textContent = fmt(x)
      hintEl.textContent = 'Which power of 2 is closest? Type n.'
      input.inputMode = 'numeric'
      input.placeholder = 'n'
    }
    if (panel?.classList.contains('open')) input.focus({ preventScroll: true })
  }

  function check() {
    const raw = input.value.trim().replace(/^2\s*\^\s*/, '').replace(/[,_\s]/g, '')
    if (raw === '') return
    answered = true
    total++
    const ok = current.accept.has(String(Number(raw))) && /^\d+$/.test(raw)
    if (ok) {
      right++
      streak++
      feedbackEl.textContent = `Correct — ${current.answerText}`
      feedbackEl.className = 'pow2-feedback ok'
    } else {
      streak = 0
      feedbackEl.textContent = `Not quite — ${current.answerText}`
      feedbackEl.className = 'pow2-feedback bad'
      tipEl.textContent = current.tip
      tipEl.hidden = false
    }
    scoreEl.textContent = `${right} / ${total} · streak ${streak}`
    submitBtn.textContent = 'Next'
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (answered) newQuestion()
    else check()
  })

  for (const btn of modeBtns) {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode
      for (const b of modeBtns) b.setAttribute('aria-pressed', String(b === btn))
      newQuestion()
    })
  }

  maxSelect.addEventListener('change', newQuestion)

  // Focus the answer box when this panel's tab is opened.
  panel?.querySelector('.tab')?.addEventListener('click', () => {
    setTimeout(() => input.focus({ preventScroll: true }), 50)
  })

  newQuestion()
}
