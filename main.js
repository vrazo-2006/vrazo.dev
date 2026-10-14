// ---- Accordions -------------------------------------------------------
// Each box (.editor) holds sections side by side. Clicking a tab slides its
// section open sideways and closes the others, and the box's height eases to
// fit the open section. On phones the CSS stacks the sections vertically
// instead and the box simply grows with its content.

const BOTTOM_SPACE = 48 // space kept between the resume box and the bottom of the window (px)
const phone = window.matchMedia('(max-width: 600px)')

const boxes = Array.from(document.querySelectorAll('.editor')).map((el) => ({
  el,
  panels: Array.from(el.querySelectorAll('.panel')),
  capToWindow: el.classList.contains('resume'),
}))

function fit(box) {
  const { el, panels, capToWindow } = box
  if (panels.length === 0) return
  if (phone.matches) {
    el.style.height = ''
    return
  }

  // Width of an open section = box width minus every tab strip and divider.
  const tabW = panels[0].querySelector('.tab').offsetWidth
  const openW = el.clientWidth - tabW * panels.length - (panels.length - 1)
  el.style.setProperty('--open-w', `${Math.max(160, openW)}px`)

  // Height = the open section's content (the resume box also stops at the
  // bottom of the window).
  const content = el.querySelector('.panel.open .panel-content')
  if (!content) return
  let h = content.offsetHeight + 2
  if (capToWindow) {
    const maxH = window.innerHeight - el.getBoundingClientRect().top - BOTTOM_SPACE
    h = Math.min(h, maxH)
  }
  el.style.height = `${Math.max(240, h)}px`
}

const fitAll = () => boxes.forEach(fit)

for (const box of boxes) {
  for (const panel of box.panels) {
    panel.querySelector('.tab').addEventListener('click', () => {
      const wasOpen = panel.classList.contains('open')
      for (const p of box.panels) {
        // On phones a second tap on an open section folds it shut.
        const open = p === panel && !(phone.matches && wasOpen)
        p.classList.toggle('open', open)
        p.querySelector('.tab').setAttribute('aria-expanded', String(open))
      }
      fit(box)
    })
  }
  // Refit when a section's content grows or shrinks (quiz feedback etc.).
  const ro = new ResizeObserver(() => fit(box))
  box.el.querySelectorAll('.panel-content').forEach((c) => ro.observe(c))
}

fitAll()
window.addEventListener('resize', fitAll)
phone.addEventListener('change', fitAll)
document.fonts.ready.then(fitAll)
