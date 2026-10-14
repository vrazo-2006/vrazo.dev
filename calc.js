// ---- Calculus practice ------------------------------------------------
// Multiple choice. Every wrong option is a specific, common mistake, so when
// you miss one it can tell you which mistake you made and what kind of
// problem it was. Missed problem types come back a couple of questions later
// with new numbers, and keep showing up more often until you get them right
// (stored in this browser only).

const root = document.getElementById('calc')

// ---------- tiny helpers ----------
const ri = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const shuffle = (arr) => {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b))
const MINUS = '−'

// x^n as HTML
const xp = (n, v = 'x') => (n === 0 ? '' : n === 1 ? v : `${v}<sup>${n}</sup>`)
// coefficient in front of something: 1·u → u, −1·u → −u
const co = (k, rest) =>
  k === 1 ? rest : k === -1 ? MINUS + rest : `${k < 0 ? MINUS : ''}${Math.abs(k)}${rest}`
// coefficient × x^n
const mono = (k, n) => (n === 0 ? `${k < 0 ? MINUS : ''}${Math.abs(k)}` : co(k, xp(n)))
// p/q, reduced; returns "3", "1/2", "−5/3"
const frac = (p, q) => {
  const g = gcd(p, q)
  p /= g
  q /= g
  if (q < 0) { p = -p; q = -q }
  const s = p < 0 ? MINUS : ''
  return q === 1 ? `${s}${Math.abs(p)}` : `${s}${Math.abs(p)}/${q}`
}
// (p/q)·rest, written for mental math: "rest", "3rest", "rest/2", "3rest/2"
const fco = (p, q, rest) => {
  const g = gcd(p, q)
  p /= g
  q /= g
  if (q < 0) { p = -p; q = -q }
  const s = p < 0 ? MINUS : ''
  const top = Math.abs(p) === 1 ? rest : `${Math.abs(p)}${rest}`
  return q === 1 ? s + top : `${s}${top} / ${q}`
}
const lin = (a, b) => `${a === 1 ? '' : a}x + ${b}` // ax + b
const e = (pow) => `e<sup>${pow}</sup>`
const D = (f) => `<span class="op">d/dx</span> [ ${f} ]`
const I = (f) => `<span class="op">&int;</span> ${f} <span class="op">dx</span>`
const Idef = (lo, hi, f, v = 'x') =>
  `<span class="op">&int;<sub>${lo}</sub><sup>${hi}</sup></span> ${f} <span class="op">d${v}</span>`
const C = ' + C'

// ---------- problem types ----------
// gen() returns { q, a, wrong: [[answer, mistake], ...] }
const TYPES = {
  // ===== derivatives =====
  d_power: {
    kind: 'd',
    name: 'Power rule',
    rule: 'd/dx xⁿ = n·xⁿ⁻¹ — bring the exponent down as a multiplier, then lower it by one.',
    gen() {
      const a = ri(2, 6), n = ri(2, 6)
      return {
        q: D(mono(a, n)),
        a: mono(a * n, n - 1),
        wrong: [
          [mono(a, n - 1), 'Lowered the exponent but forgot to multiply by it.'],
          [mono(a * n, n), 'Multiplied by the exponent but forgot to lower it by one.'],
          [fco(a, n + 1, xp(n + 1)), 'That’s the antiderivative — you integrated instead of differentiating.'],
        ],
      }
    },
  },
  d_negpow: {
    kind: 'd',
    name: 'Power rule · negative exponent',
    rule: 'Rewrite 1/xⁿ as x⁻ⁿ. The power rule gives −n·x⁻ⁿ⁻¹ — the exponent gets MORE negative, so xⁿ⁺¹ ends up in the denominator.',
    gen() {
      const n = ri(2, 5)
      return {
        q: D(`1 / ${xp(n)}`),
        a: `${MINUS}${n} / ${xp(n + 1)}`,
        wrong: [
          [`${MINUS}${n} / ${xp(n - 1)}`, 'Lowered the exponent as if it were positive. x⁻ⁿ goes to x⁻⁽ⁿ⁺¹⁾, so the denominator power goes UP.'],
          [`${n} / ${xp(n + 1)}`, 'Lost the minus sign: the exponent −n comes down as a negative multiplier.'],
          [`1 / (${co(n, xp(n - 1))})`, 'Differentiated the denominator on its own. 1/f is not 1/f′.'],
        ],
      }
    },
  },
  d_sqrt: {
    kind: 'd',
    name: 'Chain rule · square root',
    rule: '√u = u^½, so d/dx √u = u′ / (2√u). Don’t forget u′ — the derivative of the inside.',
    gen() {
      const a = pick([4, 6, 8, 10]), b = ri(1, 9)
      const r = `√(${lin(a, b)})`
      return {
        q: D(r),
        a: `${a / 2} / ${r}`,
        wrong: [
          [`1 / (2${r})`, `Forgot the chain rule — multiply by the inside’s derivative, ${a}.`],
          [`${a} / ${r}`, 'Forgot the ½ that comes down from the exponent ½.'],
          [`${a / 2}${r}`, 'The new exponent is −½, so the root goes in the denominator.'],
        ],
      }
    },
  },
  d_trig: {
    kind: 'd',
    name: 'Chain rule · trig',
    rule: 'd/dx sin(kx) = k·cos(kx) and d/dx cos(kx) = −k·sin(kx). The k comes from the chain rule; the minus sign belongs only to cos.',
    gen() {
      const k = ri(2, 9)
      if (Math.random() < 0.5) {
        return {
          q: D(`sin(${k}x)`),
          a: `${k} cos(${k}x)`,
          wrong: [
            [`cos(${k}x)`, `Forgot the chain rule — multiply by the inside’s derivative, ${k}.`],
            [`${MINUS}${k} cos(${k}x)`, 'Sign error: d/dx sin = +cos. The minus belongs to the derivative of cos.'],
            [`${MINUS}cos(${k}x) / ${k}`, 'That’s the antiderivative — you integrated instead.'],
          ],
        }
      }
      return {
        q: D(`cos(${k}x)`),
        a: `${MINUS}${k} sin(${k}x)`,
        wrong: [
          [`${k} sin(${k}x)`, 'Sign error: d/dx cos = −sin.'],
          [`${MINUS}sin(${k}x)`, `Forgot the chain rule — multiply by the inside’s derivative, ${k}.`],
          [`sin(${k}x) / ${k}`, 'That’s the antiderivative — you integrated instead.'],
        ],
      }
    },
  },
  d_exp: {
    kind: 'd',
    name: 'Chain rule · exponential',
    rule: 'd/dx e^(kx) = k·e^(kx). e^u is its own derivative; the chain rule multiplies by u′. The exponent never drops down.',
    gen() {
      const k = pick([2, 3, 4, 5, 6, 7, -2, -3, -4])
      const pw = co(k, 'x')
      return {
        q: D(e(pw)),
        a: co(k, e(pw)),
        wrong: [
          [e(pw), `Forgot the chain rule — multiply by the exponent’s derivative, ${k < 0 ? MINUS + Math.abs(k) : k}.`],
          [`${pw} · ${e(`${pw} ${MINUS} 1`)}`, 'Used the power rule on e^(…). That rule is for xⁿ, where the base is the variable — here the variable is in the exponent.'],
          [fco(1, k, e(pw)), 'Divided by k — that’s what integrating does. Differentiating multiplies.'],
        ],
      }
    },
  },
  d_chainpow: {
    kind: 'd',
    name: 'Chain rule · power of a linear',
    rule: 'd/dx (ax+b)ⁿ = n·(ax+b)ⁿ⁻¹·a. Power rule on the outside, then multiply by the inside’s derivative a.',
    gen() {
      const a = ri(2, 5), b = ri(1, 7), n = ri(2, 5)
      const u = `(${lin(a, b)})`
      return {
        q: D(`${u}<sup>${n}</sup>`),
        a: `${n * a}${u}${n - 1 === 1 ? '' : `<sup>${n - 1}</sup>`}`,
        wrong: [
          [`${n}${u}${n - 1 === 1 ? '' : `<sup>${n - 1}</sup>`}`, `Forgot the chain rule — multiply by the inside’s derivative, ${a}.`],
          [`${n * a}${u}<sup>${n}</sup>`, 'Forgot to lower the exponent by one.'],
          [`${u}<sup>${n + 1}</sup> / ${a * (n + 1)}`, 'That’s the antiderivative — you integrated instead.'],
        ],
      }
    },
  },
  d_ln: {
    kind: 'd',
    name: 'Chain rule · ln',
    rule: 'd/dx ln(u) = u′/u. For ln(kx) the k cancels: k/(kx) = 1/x. For ln(x²+c) you get 2x/(x²+c).',
    gen() {
      if (Math.random() < 0.5) {
        const k = ri(2, 9)
        return {
          q: D(`ln(${k}x)`),
          a: '1 / x',
          wrong: [
            [`1 / (${k}x)`, `Forgot the chain rule: u′/u = ${k}/(${k}x), and the ${k}s cancel.`],
            [`${k} / x`, `Multiplied by ${k} but didn’t divide by the ${k} inside the log.`],
            [`x ln(${k}x) ${MINUS} x`, 'That’s the antiderivative — you integrated instead.'],
          ],
        }
      }
      const c = ri(1, 9)
      const u = `x<sup>2</sup> + ${c}`
      return {
        q: D(`ln(${u})`),
        a: `2x / (${u})`,
        wrong: [
          [`1 / (${u})`, 'Forgot the chain rule — multiply by the inside’s derivative, 2x.'],
          [`1 / (2x)`, 'ln′(u) is 1/u — divide by the inside itself, not by its derivative.'],
          [`2x · (${u})`, 'Multiplied by the inside instead of dividing by it.'],
        ],
      }
    },
  },
  d_product: {
    kind: 'd',
    name: 'Product rule',
    rule: '(f·g)′ = f′g + fg′. Two terms — differentiate one factor at a time. It is NOT f′·g′.',
    gen() {
      return pick([
        () => ({
          q: D('x sin x'),
          a: 'sin x + x cos x',
          wrong: [
            ['cos x', 'Multiplied the two derivatives (1 · cos x). The product rule has two terms.'],
            ['x cos x', 'Dropped the f′g term (1 · sin x).'],
            [`sin x ${MINUS} x cos x`, 'Sign error: d/dx sin x = +cos x.'],
          ],
        }),
        () => ({
          q: D(`x${e('x')}`),
          a: `(x + 1)${e('x')}`,
          wrong: [
            [e('x'), 'Multiplied the two derivatives (1 · eˣ). The product rule has two terms.'],
            [`x${e('x')}`, 'Only differentiated the eˣ part — dropped the f′g term.'],
            [`(x ${MINUS} 1)${e('x')}`, 'That’s ∫ x eˣ dx — you integrated instead.'],
          ],
        }),
        () => ({
          q: D('x ln x'),
          a: 'ln x + 1',
          wrong: [
            ['1 / x', 'Multiplied the two derivatives (1 · 1/x). The product rule has two terms.'],
            ['ln x', 'Dropped the fg′ term: x · (1/x) = 1.'],
            ['1', 'Dropped the f′g term (1 · ln x).'],
          ],
        }),
        () => ({
          q: D(`x<sup>2</sup> cos x`),
          a: `2x cos x ${MINUS} x<sup>2</sup> sin x`,
          wrong: [
            [`${MINUS}2x sin x`, 'Multiplied the two derivatives. The product rule has two terms.'],
            [`2x cos x + x<sup>2</sup> sin x`, 'Sign error: d/dx cos x = −sin x.'],
            [`${MINUS}x<sup>2</sup> sin x`, 'Dropped the f′g term (2x · cos x).'],
          ],
        }),
      ])()
    },
  },
  d_ftc: {
    kind: 'd',
    name: 'FTC + chain rule',
    rule: 'd/dx ∫ₐ^(g(x)) f(t) dt = f(g(x))·g′(x). Plug the upper limit into f, then multiply by the upper limit’s derivative.',
    gen() {
      const f = pick([
        { t: 'cos t', at: (u) => `cos(${u})`, F: (u) => `sin(${u})` },
        { t: 'sin t', at: (u) => `sin(${u})`, F: (u) => `1 ${MINUS} cos(${u})` },
        { t: e('t'), at: (u) => e(u), F: (u) => `${e(u)} ${MINUS} 1` },
      ])
      const n = pick([2, 3])
      const u = xp(n)
      return {
        q: `<span class="op">d/dx</span> ${Idef(0, u, f.t, 't')}`,
        a: `${n}x${n - 1 === 1 ? '' : `<sup>${n - 1}</sup>`} ${f.at(u)}`,
        wrong: [
          [f.at(u), `Forgot the chain rule — multiply by the derivative of the upper limit, ${co(n, xp(n - 1))}.`],
          [f.at('x'), `Plugged in x instead of the upper limit ${u.replace(/<\/?sup>/g, '')}.`],
          [f.F(u), 'Found the antiderivative and plugged in. The FTC says d/dx undoes the ∫ — no integrating needed.'],
        ],
      }
    },
  },

  // ===== integrals =====
  i_power: {
    kind: 'i',
    name: 'Reverse power rule',
    rule: '∫ xⁿ dx = xⁿ⁺¹/(n+1) + C — raise the exponent by one, then divide by the NEW exponent.',
    gen() {
      const n = ri(2, 5), m = ri(1, 4), a = m * (n + 1)
      return {
        q: I(mono(a, n)),
        a: mono(m, n + 1) + C,
        wrong: [
          [mono(a * n, n - 1) + C, 'That’s the derivative — you differentiated instead.'],
          [mono(a, n + 1) + C, `Raised the exponent but forgot to divide by it (${n + 1}).`],
          [fco(a, n, xp(n + 1)) + C, `Divided by the old exponent ${n}; divide by the new one, ${n + 1}.`],
        ],
      }
    },
  },
  i_recip: {
    kind: 'i',
    name: '∫ 1/x = ln|x|',
    rule: '∫ 1/x dx = ln|x| + C. This is the one exponent (n = −1) where the power rule breaks — it would divide by zero.',
    gen() {
      const k = ri(2, 9)
      return {
        q: I(`${k} / x`),
        a: `${k} ln|x|${C}`,
        wrong: [
          [`${MINUS}${k} / x<sup>2</sup>${C}`, 'That’s the derivative — you differentiated instead.'],
          [`ln|${k}x|${C}`, `The constant ${k} multiplies the log; it doesn’t go inside it. ln|${k}x| = ln ${k} + ln|x|.`],
          [`${MINUS}${k} / (2x<sup>2</sup>)${C}`, 'Tried the power rule on x⁻¹. It fails at n = −1 — 1/x integrates to ln|x|.'],
        ],
      }
    },
  },
  i_exp: {
    kind: 'i',
    name: 'u-sub · linear inside (exp)',
    rule: '∫ e^(kx) dx = e^(kx)/k + C. With u = kx, du = k dx, so you DIVIDE by k — the opposite of the chain rule.',
    gen() {
      const k = ri(2, 9)
      const pw = `${k}x`
      return {
        q: I(e(pw)),
        a: `${e(pw)} / ${k}${C}`,
        wrong: [
          [`${k}${e(pw)}${C}`, `Multiplied by ${k} — that’s the derivative. Integrating divides.`],
          [`${e(pw)}${C}`, `Forgot to divide by ${k} (du = ${k} dx).`],
          [`${e(`${pw} + 1`)} / (${pw} + 1)${C}`, 'Used the power rule on e^(…). The variable is in the exponent, not the base.'],
        ],
      }
    },
  },
  i_trig: {
    kind: 'i',
    name: 'u-sub · linear inside (trig)',
    rule: '∫ cos(kx) dx = sin(kx)/k and ∫ sin(kx) dx = −cos(kx)/k. Divide by k, and the minus sign goes with ∫ sin.',
    gen() {
      const k = ri(2, 9)
      if (Math.random() < 0.5) {
        return {
          q: I(`cos(${k}x)`),
          a: `sin(${k}x) / ${k}${C}`,
          wrong: [
            [`${k} sin(${k}x)${C}`, `Multiplied by ${k} — that’s the chain rule for derivatives. Integrating divides.`],
            [`${MINUS}sin(${k}x) / ${k}${C}`, 'Sign error: ∫ cos = +sin.'],
            [`sin(${k}x)${C}`, `Forgot to divide by ${k} (du = ${k} dx).`],
          ],
        }
      }
      return {
        q: I(`sin(${k}x)`),
        a: `${MINUS}cos(${k}x) / ${k}${C}`,
        wrong: [
          [`cos(${k}x) / ${k}${C}`, 'Sign error: ∫ sin = −cos (because d/dx cos = −sin).'],
          [`${MINUS}${k} cos(${k}x)${C}`, `Multiplied by ${k} — integrating divides.`],
          [`${MINUS}cos(${k}x)${C}`, `Forgot to divide by ${k} (du = ${k} dx).`],
        ],
      }
    },
  },
  i_linpow: {
    kind: 'i',
    name: 'u-sub · power of a linear',
    rule: '∫ (ax+b)ⁿ dx = (ax+b)ⁿ⁺¹ / (a·(n+1)) + C. Reverse power rule, then divide by a as well.',
    gen() {
      const a = ri(2, 3), b = ri(1, 5), n = ri(1, 4)
      const u = `(${lin(a, b)})`
      const p = `${u}<sup>${n + 1}</sup>`
      return {
        q: I(n === 1 ? u : `${u}<sup>${n}</sup>`),
        a: `${p} / ${a * (n + 1)}${C}`,
        wrong: [
          [`${p} / ${n + 1}${C}`, `Forgot to divide by ${a}, the inside’s derivative (du = ${a} dx).`],
          [`${a}${p} / ${n + 1}${C}`, `Multiplied by ${a} — that’s the derivative’s chain rule. Integrating divides.`],
          [(n === 1 ? String(a) : `${n * a}${u}${n - 1 > 1 ? `<sup>${n - 1}</sup>` : ''}`) + C, 'That’s the derivative — you differentiated instead.'],
        ],
      }
    },
  },
  i_linrecip: {
    kind: 'i',
    name: 'u-sub · 1/(ax+b)',
    rule: '∫ 1/(ax+b) dx = ln|ax+b| / a + C. It’s ∫ 1/u, but du = a dx, so divide by a.',
    gen() {
      const a = ri(2, 9), b = ri(1, 9)
      const u = lin(a, b)
      return {
        q: I(`1 / (${u})`),
        a: `ln|${u}| / ${a}${C}`,
        wrong: [
          [`ln|${u}|${C}`, `Forgot to divide by ${a} (du = ${a} dx).`],
          [`${a} ln|${u}|${C}`, `Multiplied by ${a} — integrating divides.`],
          [`${MINUS}${a} / (${u})<sup>2</sup>${C}`, 'That’s the derivative — you differentiated instead.'],
        ],
      }
    },
  },
  i_usub: {
    kind: 'i',
    name: 'u-sub · inner derivative present',
    rule: 'If the inside’s derivative is sitting outside, let u = the inside. Here u = x², du = 2x dx, so x dx = du/2 — the x gets used up and you fix the constant.',
    gen() {
      const c = pick([1, 2, 3, 4, 6])
      return pick([
        () => ({
          q: I(`${co(c, 'x')} ${e('x<sup>2</sup>')}`),
          a: fco(c, 2, e('x<sup>2</sup>')) + C,
          wrong: [
            [co(c, e('x<sup>2</sup>')) + C, 'Forgot the ½: du = 2x dx, so x dx = du/2.'],
            [fco(c, 4, `x<sup>2</sup>${e('x<sup>2</sup>')}`) + C, 'Integrated the x separately. In a u-sub the x is part of du — it disappears.'],
            [fco(c, 2, 'x' + e('x<sup>2</sup>')) + C, 'Left the x in. It’s part of du = 2x dx, so it disappears in the substitution.'],
          ],
        }),
        () => ({
          q: I(`${co(c, 'x')} cos(x<sup>2</sup>)`),
          a: fco(c, 2, 'sin(x<sup>2</sup>)') + C,
          wrong: [
            [co(c, 'sin(x<sup>2</sup>)') + C, 'Forgot the ½: du = 2x dx, so x dx = du/2.'],
            [MINUS + fco(c, 2, 'sin(x<sup>2</sup>)') + C, 'Sign error: ∫ cos = +sin.'],
            [fco(c, 4, 'x<sup>2</sup> sin(x<sup>2</sup>)') + C, 'Integrated the x separately. In a u-sub the x is part of du — it disappears.'],
          ],
        }),
        () => {
          const d = ri(1, 9)
          const u = `x<sup>2</sup> + ${d}`
          return {
            q: I(`2x / (${u})`),
            a: `ln(${u})${C}`,
            wrong: [
              [`2x ln(${u})${C}`, 'The 2x is du — it gets absorbed, not left out front.'],
              [`${MINUS}2x / (${u})<sup>2</sup>${C}`, 'Treated it like a power rule / derivative. The top is the bottom’s derivative, so it’s ∫ du/u = ln|u|.'],
              [d === 1 ? `arctan(x)${C}` : `ln(2x)${C}`, d === 1 ? 'arctan comes from ∫ 1/(x²+1). The 2x on top makes it a u-sub giving ln.' : 'Took the log of the numerator. ∫ u′/u = ln of the DENOMINATOR.'],
            ],
          }
        },
        () => {
          const d = ri(1, 5), n = ri(2, 4)
          const u = `(x<sup>2</sup> + ${d})`
          return {
            q: I(`2x${u}<sup>${n}</sup>`),
            a: `${u}<sup>${n + 1}</sup> / ${n + 1}${C}`,
            wrong: [
              [`${u}<sup>${n + 1}</sup>${C}`, `Forgot to divide by the new exponent ${n + 1}.`],
              [`2x${u}<sup>${n + 1}</sup> / ${n + 1}${C}`, 'Left the 2x in. It’s du — it disappears in the substitution.'],
              [`${2 * n}x${u}${n - 1 > 1 ? `<sup>${n - 1}</sup>` : ''}${C}`, 'Used the power rule downward — that’s differentiating.'],
            ],
          }
        },
      ])()
    },
  },
  i_parts: {
    kind: 'i',
    name: 'Integration by parts',
    rule: '∫ u dv = uv − ∫ v du. Pick u = the part that gets simpler when differentiated (x, ln x). Watch the minus sign in front of the second integral.',
    gen() {
      return pick([
        () => ({
          q: I(`x${e('x')}`),
          a: `(x ${MINUS} 1)${e('x')}${C}`,
          wrong: [
            [`x${e('x')}${C}`, 'Stopped after uv — still need to subtract ∫ v du = ∫ eˣ dx.'],
            [`(x + 1)${e('x')}${C}`, 'Sign error: it’s uv MINUS ∫ v du. (x+1)eˣ is the derivative.'],
            [`x<sup>2</sup>${e('x')} / 2${C}`, 'Integrated each factor separately. ∫ f·g ≠ ∫f · ∫g — use parts.'],
          ],
        }),
        () => ({
          q: I('x cos x'),
          a: `x sin x + cos x${C}`,
          wrong: [
            [`x sin x ${MINUS} cos x${C}`, 'Sign error: uv − ∫ sin x dx = x sin x − (−cos x) = x sin x + cos x.'],
            [`x sin x${C}`, 'Stopped after uv — still need to subtract ∫ v du = ∫ sin x dx.'],
            [`x<sup>2</sup> sin x / 2${C}`, 'Integrated each factor separately. ∫ f·g ≠ ∫f · ∫g — use parts.'],
          ],
        }),
        () => ({
          q: I('x sin x'),
          a: `sin x ${MINUS} x cos x${C}`,
          wrong: [
            [`${MINUS}x cos x${C}`, 'Stopped after uv — still need to subtract ∫ v du = ∫ −cos x dx.'],
            [`x cos x ${MINUS} sin x${C}`, 'Sign error: ∫ sin x = −cos x, so uv = −x cos x.'],
            [`${MINUS}x<sup>2</sup> cos x / 2${C}`, 'Integrated each factor separately. ∫ f·g ≠ ∫f · ∫g — use parts.'],
          ],
        }),
        () => ({
          q: I('ln x'),
          a: `x ln x ${MINUS} x${C}`,
          wrong: [
            [`1 / x${C}`, 'That’s the derivative — you differentiated instead.'],
            [`x ln x${C}`, 'Stopped after uv — still need to subtract ∫ x · (1/x) dx = x.'],
            [`(ln x)<sup>2</sup> / 2${C}`, 'That’s ∫ (ln x)/x dx, a u-sub. Plain ln x needs parts with u = ln x, dv = dx.'],
          ],
        }),
      ])()
    },
  },
  i_definite: {
    kind: 'i',
    name: 'Definite integral',
    rule: '∫ₐᵇ f dx = F(b) − F(a): plug the limits into the ANTIDERIVATIVE, top minus bottom. Odd functions over [−a, a] cancel to 0.',
    gen() {
      return pick([
        () => ({
          q: Idef(0, 'π', 'sin x'),
          a: '2',
          wrong: [
            ['0', 'Sign slip: [−cos x]₀^π = −cos π − (−cos 0) = 1 + 1 = 2.'],
            [`${MINUS}2`, 'Used +cos as the antiderivative. ∫ sin = −cos.'],
            ['1', 'Only evaluated at one limit. It’s F(b) − F(a).'],
          ],
        }),
        () => {
          const a = pick([3, 5, 6, 7, 8, 9])
          return {
            q: Idef(0, a, '2x'),
            a: String(a * a),
            wrong: [
              [String(2 * a * a), 'The antiderivative of 2x is x², not 2x².'],
              [String(2 * a), 'Plugged the limit into the integrand, not the antiderivative.'],
              [frac(a * a, 2), 'Divided by 2 twice — ∫ 2x = 2 · x²/2 = x².'],
            ],
          }
        },
        () => {
          const a = ri(1, 3)
          return {
            q: Idef(`${MINUS}${a}`, a, 'x<sup>3</sup>'),
            a: '0',
            wrong: [
              [frac(a ** 4, 2), 'Added the two halves instead of subtracting. x³ is odd, so the halves cancel to 0.'],
              [frac(a ** 4, 4), 'Only evaluated the top limit. (−a)⁴/4 is subtracted too.'],
              [String(2 * a ** 3), 'Plugged into x³ itself, not x⁴/4 — and odd functions over [−a, a] give 0.'],
            ],
          }
        },
        () => ({
          q: Idef(1, 'e', '1 / x'),
          a: '1',
          wrong: [
            [`e ${MINUS} 1`, 'Used x as the antiderivative of 1/x. It’s ln x: ln e − ln 1 = 1 − 0.'],
            ['0', 'ln 1 = 0, but ln e = 1, so the answer is 1 − 0.'],
            [`1/e ${MINUS} 1`, 'Plugged into 1/x itself, not its antiderivative ln x.'],
          ],
        }),
      ])()
    },
  },
}

// ---------- stats (this browser only) ----------
const KEY = 'calc-practice-v1'
function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}
function saveStats() {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats))
  } catch {}
}
let stats = loadStats() // { type: { miss: weight, seen, wrong } }
const st = (t) => (stats[t] ||= { miss: 0, seen: 0, wrong: 0 })

if (root) {
  const tagEl = root.querySelector('.calc-tag')
  const promptEl = root.querySelector('.calc-prompt')
  const choicesEl = root.querySelector('.calc-choices')
  const explainEl = root.querySelector('.calc-explain')
  const nextBtn = root.querySelector('.calc-next')
  const scoreEl = root.querySelector('.calc-score')
  const weakEl = root.querySelector('.calc-weak')
  const resetBtn = root.querySelector('.calc-reset')
  const modeBtns = Array.from(root.querySelectorAll('.calc-mode button'))
  const panel = root.closest('.panel')

  let mode = 'mixed'
  let current = null
  let answered = false
  let right = 0, total = 0, streak = 0, qNum = 0
  let lastType = null
  let retry = [] // [{ type, due }]

  const weakTypes = () =>
    Object.keys(TYPES).filter((t) => stats[t]?.miss > 0.4).sort((a, b) => stats[b].miss - stats[a].miss)

  function chooseType() {
    // A recently missed type comes back with new numbers.
    const dueIdx = retry.findIndex((r) => r.due <= qNum)
    if (dueIdx >= 0) return retry.splice(dueIdx, 1)[0].type

    let pool = Object.keys(TYPES)
    if (mode === 'd' || mode === 'i') pool = pool.filter((t) => TYPES[t].kind === mode)
    if (mode === 'weak') {
      const w = weakTypes()
      if (w.length) pool = w
    }
    if (pool.length > 1) pool = pool.filter((t) => t !== lastType)
    // Types you miss show up more often.
    const weights = pool.map((t) => 1 + 3 * (stats[t]?.miss || 0))
    let r = Math.random() * weights.reduce((a, b) => a + b, 0)
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i]
      if (r <= 0) return pool[i]
    }
    return pool[pool.length - 1]
  }

  function renderWeak() {
    const w = weakTypes().slice(0, 3)
    weakEl.textContent = w.length ? `weak: ${w.map((t) => TYPES[t].name).join(', ')}` : ''
    const weakBtn = modeBtns.find((b) => b.dataset.mode === 'weak')
    weakBtn.disabled = weakTypes().length === 0 && mode !== 'weak'
  }

  function newQuestion() {
    qNum++
    const type = chooseType()
    lastType = type
    const p = TYPES[type].gen()
    // Drop any accidental duplicates of the right answer.
    const seen = new Set([p.a])
    const wrong = p.wrong.filter(([w]) => w && !seen.has(w) && seen.add(w))
    current = { type, ...p, wrong }
    answered = false

    tagEl.textContent = TYPES[type].kind === 'd' ? 'Differentiate' : 'Integrate'
    promptEl.innerHTML = p.q
    explainEl.hidden = true
    explainEl.innerHTML = ''
    nextBtn.hidden = true
    choicesEl.innerHTML = ''

    const opts = shuffle([{ text: p.a, ok: true }, ...wrong.map(([text, why]) => ({ text, why, ok: false }))])
    opts.forEach((o, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'calc-choice'
      if (o.ok) b.dataset.ok = '1'
      b.innerHTML = `<span class="calc-key">${i + 1}</span><span class="calc-ans">${o.text}</span>`
      b.addEventListener('click', () => answer(o, b))
      choicesEl.appendChild(b)
    })
  }

  function answer(opt, btn) {
    if (answered) return
    answered = true
    total++
    const t = current.type
    const s = st(t)
    s.seen++

    for (const b of choicesEl.children) {
      b.disabled = true
      if (b.dataset.ok) b.classList.add('ok')
    }

    if (opt.ok) {
      right++
      streak++
      s.miss *= 0.5
      if (s.miss < 0.05) s.miss = 0
      explainEl.innerHTML = `<p class="calc-verdict ok">Correct.</p><p class="calc-type">${TYPES[t].name}</p>`
    } else {
      streak = 0
      s.miss += 1
      s.wrong++
      btn.classList.add('bad')
      // Re-test this type soon, with different numbers.
      if (!retry.some((r) => r.type === t)) retry.push({ type: t, due: qNum + 2 })
      explainEl.innerHTML = `
        <p class="calc-verdict bad">Not quite. Answer: <span class="calc-ans">${current.a}</span></p>
        <p class="calc-type">Problem type: <strong>${TYPES[t].name}</strong></p>
        <p class="calc-rule">${TYPES[t].rule}</p>
        <p class="calc-why"><span class="label">Your pick:</span> ${opt.why}</p>
        <p class="calc-soon">You’ll get another one of these in a couple of questions.</p>`
    }
    saveStats()
    explainEl.hidden = false
    nextBtn.hidden = false
    scoreEl.textContent = `${right} / ${total} · streak ${streak}`
    renderWeak()
    nextBtn.focus({ preventScroll: true })
  }

  nextBtn.addEventListener('click', newQuestion)

  // Keyboard: 1–4 to answer, Enter for next (only while this panel is open).
  document.addEventListener('keydown', (ev) => {
    if (!panel?.classList.contains('open')) return
    if (ev.target.closest('input, select, textarea')) return
    if (!answered && /^[1-4]$/.test(ev.key)) {
      const b = choicesEl.children[Number(ev.key) - 1]
      if (b) b.click()
    } else if (answered && ev.key === 'Enter' && ev.target !== nextBtn) {
      newQuestion()
    }
  })

  for (const btn of modeBtns) {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode
      for (const b of modeBtns) b.setAttribute('aria-pressed', String(b === btn))
      retry = []
      newQuestion()
      renderWeak()
    })
  }

  resetBtn.addEventListener('click', () => {
    stats = {}
    saveStats()
    retry = []
    right = total = streak = 0
    scoreEl.textContent = '0 / 0 · streak 0'
    if (mode === 'weak') modeBtns[0].click()
    renderWeak()
  })

  renderWeak()
  newQuestion()
}

export { TYPES }
