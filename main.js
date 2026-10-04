import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'

// ---- Settings ---------------------------------------------------------
const FONT_SIZE = 16         // size of the background text, in px
const LINE_GAP = 1           // extra space between lines, in px (0 = lines nearly touching)
const FONT = `${FONT_SIZE}px "Times New Roman", Times, serif` // must match what we draw with
const LINE_HEIGHT = FONT_SIZE + LINE_GAP
const COLOR = '#3a3a3d'      // dark gray
const BORDER_COLOR = '#3d7bff' // blue characters that outline the text box
const EDGE = 3               // margin between the background text and the window edges (px)
const GAP = 3                // space between the box and the nearest character
const BLUE_SPACE = '·'       // what a space looks like when it's part of the blue border
const MIN_SEGMENT = 36       // skip slivers narrower than this
// 'fixed'      -> the text stays still; drag the text box around and the
//                 text rearranges itself around it (like negative space)
// 'horizontal' -> words drift left to right and Pretext rewraps every line
// 'ticker'     -> one smooth ribbon of characters (words get cut at edges)
// 'vertical'   -> lines drift top to bottom
const FLOW = 'fixed'
const JUSTIFY = true         // stretch lines so both ends sit flush
const GRAB = 18              // how close to the box's edge you grab it to drag (px)
const BOTTOM_SPACE = 64       // space kept between the box and the bottom of the window (px)
const GLIDE = 12            // how quickly the box catches up to the mouse (higher = snappier)
const SPEED = 100             // pixels per second the text drifts down

const TEXT = `The gods believed there was no punishment worse than labor that leads nowhere, so they gave Sisyphus a stone and a hill. \
Each day he leans his shoulder into the rock and drives it upward, step by step, until the summit is close enough to touch, \
and each day the stone slips loose and thunders back down to the plain. There is no trick to it and no end to it. \
The story is usually told as a warning, but it is worth looking again at the moment no one paints: the walk back down. \
His hands are empty. The weight is gone for a while. He can see the whole valley, the road he has worn into the slope, \
the stone waiting at the bottom like an old companion. In that descent he is not pushing anything. He is only thinking. \
Whatever he thinks there belongs to him and not to the gods who sentenced him. \
We live under a quieter version of the same sentence. We wake, we work, we eat, we sleep, and the days repeat in a rhythm \
so steady that most of the time we do not notice it. Then one ordinary afternoon the question arrives without warning: why? \
Why this road, this effort, this hill? The world does not answer. It was never built to answer. \
The gap between our need for meaning and the silence that meets it is what some writers have called the absurd. \
It is not a feeling that belongs to the world or to us alone; it lives in the meeting of the two. \
There are easy ways out of that gap. We can pretend the question was never asked, or we can borrow an answer from somewhere \
far away and promise ourselves that the hill makes sense from a height we will never reach. \
The harder path is to stay in the gap with our eyes open, to keep the question and keep living anyway. \
That refusal to look away is a kind of freedom. If nothing is promised, nothing is owed. Every morning becomes a choice rather than a duty. \
The stone does not get lighter, but the man who pushes it is no longer only a prisoner. He knows exactly what his task is, \
how it will end, and that it will begin again. Knowing all of that, he walks down the hill and puts his hands on the rock once more. \
His fate is still his fate, yet he has taken hold of it, the way a craftsman takes hold of a tool. \
Seen this way the hill is not a punishment so much as a place. It has weather and seasons. Grass grows between the stones. \
The ridge catches the first light before the valley does. Each grain of the rock, each crack along its face, is a small world \
he alone has come to know. The struggle toward the summit is enough to fill a life, not because it leads somewhere else, \
but because it is happening now, under this sky, in these hands. Perhaps that is the secret the story keeps: \
the meaning was never waiting at the top of the hill. It was in the climbing, and in the long walk down, \
and in the moment, at the bottom, when he looks at the stone and decides once again to begin. \
`

// ---- Setup ------------------------------------------------------------
const canvas = document.getElementById('flow')
const ctx = canvas.getContext('2d')
const editor = document.getElementById('editor')
const START = { segmentIndex: 0, graphemeIndex: 0 }
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

let prepared = null
let loopSegments = 0 // how many segments one copy of TEXT has
let width = 0
let height = 0
let lineStarts = []  // where each full-width line begins, for one pass of TEXT
let topIndex = 0     // which of those lines is currently the top row
let offset = 0       // how far (0..LINE_HEIGHT) the rows have slid down
let shift = 0        // how far the text has slid to the right (horizontal mode)
let ribbon = null    // the passage as one long line of characters (ticker mode)
let flowStart = START  // first word on the page (horizontal mode)
let indent = 0         // how far that first word has been pushed right
let prevWord = null    // the word (plus its space) that slides in next

// Cache text widths: measuring is the slow part, drawing is cheap.
const widthCache = new Map()
function measure(s) {
  let w = widthCache.get(s)
  if (w === undefined) {
    w = ctx.measureText(s).width
    widthCache.set(s, w)
  }
  return w
}

function prepare() {
  // Two copies back to back, so a line can run straight from the end of the
  // passage into its beginning. Cursors are wrapped back into the first copy.
  loopSegments = prepareWithSegments(TEXT, FONT).segments.length
  prepared = prepareWithSegments(TEXT + TEXT, FONT)
  widthCache.clear()
  computeLineStarts()
  buildRibbon()
  flowStart = START
  indent = 0
  prevWord = previousWord(flowStart)
}

function wrap(cursor) {
  if (cursor.segmentIndex < loopSegments) return cursor
  return { segmentIndex: cursor.segmentIndex - loopSegments, graphemeIndex: cursor.graphemeIndex }
}

// The rows at the top of the page are always full width, so the text that
// scrolls in from above can be precomputed as a long list of full-width lines.
// The text drifts down, so we walk this list backwards from the end.
// (3000 lines at 24px/s lasts roughly 45 minutes before it restarts.)
const LINE_COUNT = 3000
function computeLineStarts() {
  const w = width - EDGE * 2
  lineStarts = []
  let cursor = START
  for (let i = 0; i < LINE_COUNT; i++) {
    const line = layoutNextLine(prepared, cursor, w)
    if (line === null) break
    lineStarts.push(cursor)
    cursor = wrap(line.end)
  }
  if (lineStarts.length === 0) lineStarts = [START]
  topIndex = lineStarts.length - 1
}

function resize() {
  const dpr = window.devicePixelRatio || 1
  width = window.innerWidth
  height = window.innerHeight
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.font = FONT
  widthCache.clear()
  if (prepared) {
    computeLineStarts()
    buildRibbon()
  }
}

// ---- Geometry ---------------------------------------------------------
// The box's left/right edges for a row, following its rounded corners.
// Returns null when the row doesn't overlap the box vertically.
function boxEdgesForRow(rowTop, rowBottom, box, r) {
  if (rowBottom <= box.top || rowTop >= box.bottom) return null
  // The widest part of the box inside this row is the point nearest its middle.
  const mid = (box.top + box.bottom) / 2
  const y = Math.min(Math.max(mid, rowTop), rowBottom)
  let dy = 0
  if (y < box.top + r) dy = box.top + r - y
  else if (y > box.bottom - r) dy = y - (box.bottom - r)
  const inset = dy > 0 ? r - Math.sqrt(Math.max(0, r * r - dy * dy)) : 0
  return [box.left + inset, box.right - inset]
}

// ---- Drawing ----------------------------------------------------------
// Draw one line of text between x0 and x1, justified so both ends sit on
// their edges. `blue` decides which characters are drawn in blue:
//   'last'  -> the final character (line ends at the box's left side)
//   'first' -> the first character (line starts at the box's right side)
//   [a, b]  -> every character between x = a and x = b (rows above/below the box)
function drawLine(text, x0, x1, y, align, blue, justify = true) {
  const words = text.trim().split(/ +/).filter(Boolean)
  if (words.length === 0) return
  const widths = words.map(measure)
  const total = widths.reduce((a, b) => a + b, 0)
  const space = measure(' ')

  let gap = words.length > 1 ? (x1 - x0 - total) / (words.length - 1) : 0
  let x = x0
  if (!justify) {
    gap = space
  } else if (words.length === 1) {
    // A single word can't be justified: push it against the box instead.
    gap = space
    if (align === 'right') x = x1 - (total + space * (words.length - 1))
  }

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const isFirst = i === 0
    const isLast = i === words.length - 1

    if (blue === 'last' && isLast) {
      drawWordWithBlueAt(word, x, y, word.length - 1)
    } else if (blue === 'first' && isFirst) {
      drawWordWithBlueAt(word, x, y, 0)
    } else if (Array.isArray(blue) && x < blue[1] && x + widths[i] > blue[0]) {
      drawWordInRange(word, x, y, blue[0], blue[1])
    } else {
      paint(word, x, y)
    }
    x += widths[i] + gap
  }
}

function drawWordWithBlueAt(word, x, y, index) {
  const chars = Array.from(word)
  const before = chars.slice(0, index).join('')
  const ch = chars[index]
  const after = chars.slice(index + 1).join('')
  if (before) paint(before, x, y)
  const xCh = x + measure(before)
  ctx.fillStyle = BORDER_COLOR
  ctx.fillText(ch, xCh, y)
  if (after) paint(after, xCh + measure(ch), y)
}

function drawWordInRange(word, x, y, a, b) {
  let prefix = ''
  for (const ch of Array.from(word)) {
    const cx = x + measure(prefix)
    const cw = measure(ch)
    if (cx < b && cx + cw > a) {
      ctx.fillStyle = BORDER_COLOR
      ctx.fillText(ch, cx, y)
    } else {
      paint(ch, cx, y)
    }
    prefix += ch
  }
}

function nextLine(cursor, spanWidth) {
  const line = layoutNextLine(prepared, cursor, spanWidth)
  if (line) line.end = wrap(line.end)
  return line
}

function drawVertical() {
  ctx.clearRect(0, 0, width, height)
  ctx.font = FONT
  ctx.textBaseline = 'top'

  const box = editor.getBoundingClientRect()
  const radius = parseFloat(getComputedStyle(editor).borderTopLeftRadius) || 0
  // In fixed mode the text always starts at the beginning, at the top.
  // Otherwise start one row above the screen so new text slides in.
  let cursor = FLOW === 'fixed' ? START : lineStarts[topIndex]
  const firstY = FLOW === 'fixed' ? EDGE : EDGE - LINE_HEIGHT + offset

  for (let y = firstY; y < height; y += LINE_HEIGHT) {
    const top = y
    const bottom = y + LINE_HEIGHT
    const edges = boxEdgesForRow(top, bottom, box, radius)

    if (edges === null) {
      // Full-width row. If it's the row directly above or below the box,
      // the characters over the box form its top/bottom border.
      const touchesTop = bottom <= box.top && bottom + LINE_HEIGHT > box.top
      const touchesBottom = top >= box.bottom && top - LINE_HEIGHT < box.bottom
      const blue = touchesTop || touchesBottom ? [box.left + radius * 0.3, box.right - radius * 0.3] : null
      const line = nextLine(cursor, width - EDGE * 2)
      if (!line) continue
      drawLine(line.text, EDGE, width - EDGE, y + LINE_GAP / 2, 'left', blue, JUSTIFY)
      cursor = line.end
      continue
    }

    // Row beside the box: a left piece that ends at the box, and a right
    // piece that starts at it. The character touching the box is blue.
    const [left, right] = edges
    const pieces = [
      [EDGE, left - GAP, 'right', 'last'],
      [right + GAP, width - EDGE, 'left', 'first'],
    ]
    for (const [x0, x1, align, blue] of pieces) {
      if (x1 - x0 < MIN_SEGMENT) continue
      const line = nextLine(cursor, x1 - x0)
      if (!line) continue
      drawLine(line.text, x0, x1, y + LINE_GAP / 2, align, blue, JUSTIFY)
      cursor = line.end
    }
  }
}

// ---- Ticker mode ------------------------------------------------
// The passage is laid out as one endless ribbon of characters that snakes
// through every row: off the right end of one piece, onto the start of the
// next. Sliding the ribbon makes the whole page flow left to right.
function buildRibbon() {
  ctx.font = FONT
  const chars = Array.from(TEXT.replace(/\s+/g, ' '))
  const pos = []
  const widths = []
  let x = 0
  for (const ch of chars) {
    const w = measure(ch)
    pos.push(x)
    widths.push(w)
    x += w
  }
  ribbon = { chars, pos, widths, length: x }
}

// Index of the character at ribbon position p (0 <= p < length).
function ribbonIndexAt(p) {
  const { pos } = ribbon
  let lo = 0
  let hi = pos.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (pos[mid] <= p) lo = mid
    else hi = mid - 1
  }
  return lo
}

// Draw the part of the ribbon that starts at position `start`, between x0 and x1.
function drawRibbonPiece(x0, x1, y, start, blue) {
  const { chars, pos, widths, length } = ribbon
  const p = ((start % length) + length) % length
  let i = ribbonIndexAt(p)
  let x = x0 - (p - pos[i])

  // Collect the visible characters first (spaces included), so we know
  // which one touches the box.
  const visible = []
  while (x < x1) {
    visible.push([chars[i], x, widths[i]])
    x += widths[i]
    i = (i + 1) % chars.length
  }
  if (visible.length === 0) return

  let blueIndex = -1
  if (blue === 'last') blueIndex = visible.length - 1
  if (blue === 'first') blueIndex = 0

  ctx.save()
  ctx.beginPath()
  ctx.rect(x0, y - LINE_GAP, x1 - x0, LINE_HEIGHT + LINE_GAP)
  ctx.clip()
  visible.forEach(([ch, cx, cw], k) => {
    const inRange = Array.isArray(blue) && cx < blue[1] && cx + cw > blue[0]
    const isBlue = k === blueIndex || inRange
    if (ch === ' ') {
      // A space is invisible, so a blue one is drawn as a small mark instead.
      if (!isBlue) return
      ctx.fillStyle = BORDER_COLOR
      ctx.fillText(BLUE_SPACE, cx + (cw - measure(BLUE_SPACE)) / 2, y)
      return
    }
    if (isBlue) {
      ctx.fillStyle = BORDER_COLOR
      ctx.fillText(ch, cx, y)
    } else {
      paint(ch, cx, y)
    }
  })
  ctx.restore()
}

function drawTicker() {
  ctx.clearRect(0, 0, width, height)
  ctx.font = FONT
  ctx.textBaseline = 'top'

  const box = editor.getBoundingClientRect()
  const radius = parseFloat(getComputedStyle(editor).borderTopLeftRadius) || 0
  let start = -shift

  for (let y = EDGE; y + LINE_HEIGHT <= height; y += LINE_HEIGHT) {
    const top = y
    const bottom = y + LINE_HEIGHT
    const edges = boxEdgesForRow(top, bottom, box, radius)
    let pieces

    if (edges === null) {
      const touchesTop = bottom <= box.top && bottom + LINE_HEIGHT > box.top
      const touchesBottom = top >= box.bottom && top - LINE_HEIGHT < box.bottom
      const blue = touchesTop || touchesBottom ? [box.left + radius * 0.3, box.right - radius * 0.3] : null
      pieces = [[EDGE, width - EDGE, blue]]
    } else {
      const [left, right] = edges
      pieces = [
        [EDGE, left - GAP, 'last'],
        [right + GAP, width - EDGE, 'first'],
      ]
    }

    for (const [x0, x1, blue] of pieces) {
      if (x1 - x0 < MIN_SEGMENT) continue
      drawRibbonPiece(x0, x1, y + LINE_GAP / 2, start, blue)
      start += x1 - x0
    }
  }
}

// ---- Horizontal mode (Pretext) ----------------------------------------
// The first line gets an invisible indent that grows a little every frame,
// pushing its words to the right. Pretext rewraps every line with
// layoutNextLine, so a word that no longer fits drops to the next line,
// which pushes that line along, and so on down the page. Once the indent is
// as wide as the word before the first one, that word becomes the new
// first word and the indent resets — so the motion never jumps.
const isSpace = (seg) => /^\s+$/.test(seg)

function previousWord(cursor) {
  const segs = prepared.segments
  const n = loopSegments
  let j = (cursor.segmentIndex - 1 + n) % n
  let w = 0
  let guard = 0
  while (isSpace(segs[j]) && guard++ < n) {
    w += measure(segs[j])
    j = (j - 1 + n) % n
  }
  while (guard++ < n) {
    w += measure(segs[j])
    const k = (j - 1 + n) % n
    if (isSpace(segs[k])) break
    j = k
  }
  return { cursor: { segmentIndex: j, graphemeIndex: 0 }, width: w }
}

function drawHorizontal() {
  ctx.clearRect(0, 0, width, height)
  ctx.font = FONT
  ctx.textBaseline = 'top'

  const box = editor.getBoundingClientRect()
  const radius = parseFloat(getComputedStyle(editor).borderTopLeftRadius) || 0
  let cursor = flowStart
  let first = true

  for (let y = EDGE; y + LINE_HEIGHT <= height; y += LINE_HEIGHT) {
    const top = y
    const bottom = y + LINE_HEIGHT
    const edges = boxEdgesForRow(top, bottom, box, radius)
    let pieces

    if (edges === null) {
      const touchesTop = bottom <= box.top && bottom + LINE_HEIGHT > box.top
      const touchesBottom = top >= box.bottom && top - LINE_HEIGHT < box.bottom
      const blue = touchesTop || touchesBottom ? [box.left + radius * 0.3, box.right - radius * 0.3] : null
      pieces = [[EDGE, width - EDGE, blue]]
    } else {
      const [left, right] = edges
      pieces = [
        [EDGE, left - GAP, 'last'],
        [right + GAP, width - EDGE, 'first'],
      ]
    }

    for (let [x0, x1, blue] of pieces) {
      if (first) {
        x0 += indent // the growing indent that pushes everything right
        first = false
      }
      if (x1 - x0 < MIN_SEGMENT) continue
      const line = nextLine(cursor, x1 - x0)
      if (!line) continue
      drawLine(line.text, x0, x1, y + LINE_GAP / 2, 'left', blue, false)
      cursor = line.end
    }
  }
}

function draw() {
  if (FLOW === 'horizontal') drawHorizontal()
  else if (FLOW === 'ticker') drawTicker()
  else drawVertical() // 'vertical' and 'fixed'
}

// Draw a piece of gray background text.
function paint(text, x, y) {
  ctx.fillStyle = COLOR
  ctx.fillText(text, x, y)
}

// ---- Animation -------------------------------------------------------
let last = performance.now()
let paused = false

let justDragged = false

// Click anywhere outside the text box to freeze / unfreeze the text.
document.addEventListener('click', (event) => {
  if (justDragged || editor.contains(event.target) || event.target.closest('a')) return
  paused = !paused
})

// Where the box starts: below the contact line, with room for the row of
// blue border letters in between.
function boxStartY() {
  const headerBottom = document.querySelector('.header').getBoundingClientRect().bottom
  return headerBottom + LINE_HEIGHT + 8
}

// ---- Resume accordion -----------------------------------------------
// Three sections side by side. Clicking a tab slides its section open
// sideways and closes the others; in fixed mode the box's height then
// eases to fit the open section, and the background text reflows around it.
const panels = Array.from(editor.querySelectorAll('.panel'))

function fitAccordion() {
  if (panels.length === 0) return
  // Width of an open section = box width minus every tab strip and divider.
  const tabW = panels[0].querySelector('.tab').offsetWidth
  const openW = editor.clientWidth - tabW * panels.length - (panels.length - 1)
  editor.style.setProperty('--open-w', `${Math.max(160, openW)}px`)

  if (FLOW !== 'fixed') return
  // Height = the open section's content, within the window.
  const content = editor.querySelector('.panel.open .panel-content')
  if (!content) return
  // Leave room for the header above and a margin below, so the box never
  // has to be pushed up over the name / contact line to stay on screen.
  const maxH = window.innerHeight - boxStartY() - BOTTOM_SPACE
  const h = Math.max(240, Math.min(content.offsetHeight + 2, maxH))
  editor.style.height = `${h}px`
}

for (const panel of panels) {
  const tab = panel.querySelector('.tab')
  tab.addEventListener('click', () => {
    for (const p of panels) {
      const open = p === panel
      p.classList.toggle('open', open)
      p.querySelector('.tab').setAttribute('aria-expanded', String(open))
    }
    fitAccordion()
  })
}

fitAccordion()
window.addEventListener('resize', fitAccordion)

// ---- Dragging the box (fixed mode) ----------------------------------
// Grab the box near its edge and move it; the text flows around it.
const boxPos = { x: 0, y: 0 }    // where the box is drawn
const boxTarget = { x: 0, y: 0 } // where the mouse wants it
let dragging = false
const grabOffset = { x: 0, y: 0 }

function clampTarget() {
  const w = editor.offsetWidth
  const h = editor.offsetHeight
  const W = window.innerWidth
  const H = window.innerHeight
  boxTarget.x = Math.min(Math.max(boxTarget.x, EDGE), Math.max(EDGE, W - w - EDGE))
  boxTarget.y = Math.min(Math.max(boxTarget.y, EDGE), Math.max(EDGE, H - h - EDGE))
}

function applyBox() {
  editor.style.transform = `translate(${boxPos.x}px, ${boxPos.y}px)`
}

function nearEdge(event) {
  const r = editor.getBoundingClientRect()
  const d = Math.min(event.clientX - r.left, r.right - event.clientX, event.clientY - r.top, r.bottom - event.clientY)
  return d < GRAB
}

if (FLOW === 'fixed') {
  editor.classList.add('floating')
  fitAccordion() // the box just changed size
  // Start in the middle of the window.
  // Start centered horizontally, just below the name and contact line.
  boxTarget.x = (window.innerWidth - editor.offsetWidth) / 2
  boxTarget.y = boxStartY()
  clampTarget()
  boxPos.x = boxTarget.x
  boxPos.y = boxTarget.y
  applyBox()

  editor.addEventListener('pointermove', (event) => {
    if (!dragging) editor.classList.toggle('grab-edge', nearEdge(event) && !event.target.closest('.tab'))
  })
  editor.addEventListener('pointerdown', (event) => {
    if (!nearEdge(event) || event.target.closest('.tab')) return // inside: normal clicking / selecting
    event.preventDefault()
    dragging = true
    editor.classList.add('dragging')
    grabOffset.x = event.clientX - boxTarget.x
    grabOffset.y = event.clientY - boxTarget.y
    editor.setPointerCapture(event.pointerId)
  })
  editor.addEventListener('pointermove', (event) => {
    if (!dragging) return
    boxTarget.x = event.clientX - grabOffset.x
    boxTarget.y = event.clientY - grabOffset.y
    clampTarget()
  })
  const endDrag = () => {
    if (!dragging) return
    dragging = false
    editor.classList.remove('dragging')
    justDragged = true
    setTimeout(() => (justDragged = false), 0)
  }
  editor.addEventListener('pointerup', endDrag)
  editor.addEventListener('pointercancel', endDrag)
  window.addEventListener('resize', clampTarget)
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1) // clamp after tab switches
  last = now

  if (FLOW === 'fixed') {
    // Glide the box toward where it's being dragged (and keep it on
    // screen while the accordion changes its height).
    clampTarget()
    const k = reduceMotion ? 1 : Math.min(1, dt * GLIDE)
    boxPos.x += (boxTarget.x - boxPos.x) * k
    boxPos.y += (boxTarget.y - boxPos.y) * k
    applyBox()
  }

  if (!reduceMotion && !paused && FLOW === 'ticker') {
    shift = (shift + SPEED * dt) % ribbon.length
  }

  if (!reduceMotion && !paused && FLOW === 'horizontal' && prevWord) {
    indent += SPEED * dt
    // The indent now fits the previous word: make it the first word.
    while (indent >= prevWord.width) {
      indent -= prevWord.width
      flowStart = prevWord.cursor
      prevWord = previousWord(flowStart)
    }
  }

  if (!reduceMotion && !paused && FLOW === 'vertical') {
    offset += SPEED * dt
    // Each time the rows slide a full line down, the line just above the
    // screen becomes the new top row (one step back through the passage).
    while (offset >= LINE_HEIGHT) {
      offset -= LINE_HEIGHT
      topIndex = (topIndex - 1 + lineStarts.length) % lineStarts.length
    }
  }

  draw()
  requestAnimationFrame(tick)
}

resize()
prepare()
window.addEventListener('resize', resize)

// Re-measure once fonts are definitely loaded.
document.fonts.ready.then(prepare)

requestAnimationFrame(tick)
