// ---- Resume accordion -------------------------------------------------
// Three sections side by side. Clicking a tab slides its section open
// sideways and closes the others, and the box's height eases to fit the
// open section (within the window).

const BOTTOM_SPACE = 48 // space kept between the box and the bottom of the window (px)

const editor = document.getElementById('editor')
const panels = Array.from(editor.querySelectorAll('.panel'))

function fitAccordion() {
  if (panels.length === 0) return

  // Width of an open section = box width minus every tab strip and divider.
  const tabW = panels[0].querySelector('.tab').offsetWidth
  const openW = editor.clientWidth - tabW * panels.length - (panels.length - 1)
  editor.style.setProperty('--open-w', `${Math.max(160, openW)}px`)

  // Height = the open section's content, but never past the bottom of the window.
  const content = editor.querySelector('.panel.open .panel-content')
  if (!content) return
  const top = editor.getBoundingClientRect().top
  const maxH = window.innerHeight - top - BOTTOM_SPACE
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
document.fonts.ready.then(fitAccordion)
