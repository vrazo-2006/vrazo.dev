// ---- Resume accordion -------------------------------------------------
// Desktop: sections sit side by side as thin vertical tabs; clicking one
// slides it open sideways and closes the others, and the block's height
// eases to fit. Phones: the CSS stacks the tabs as rows that unfold
// downward, and a second tap folds an open section shut.

const phone = window.matchMedia('(max-width: 600px)')
const acc = document.getElementById('resume')
const panels = Array.from(acc.querySelectorAll('.panel'))

function fit() {
  if (phone.matches) {
    acc.style.height = ''
    return
  }
  // Width of an open section = block width minus every tab strip.
  const tabW = panels[0].querySelector('.tab').offsetWidth
  acc.style.setProperty('--open-w', `${Math.max(200, acc.clientWidth - tabW * panels.length)}px`)

  const content = acc.querySelector('.panel.open .panel-content')
  acc.style.height = content ? `${Math.max(160, content.offsetHeight)}px` : ''
}

for (const panel of panels) {
  panel.querySelector('.tab').addEventListener('click', () => {
    const wasOpen = panel.classList.contains('open')
    for (const p of panels) {
      // On desktop one section is always open; on phones they can all fold.
      const open = p === panel ? !(phone.matches && wasOpen) : false
      p.classList.toggle('open', open)
      const tab = p.querySelector('.tab')
      tab.setAttribute('aria-expanded', String(open))
      tab.querySelector('.tab-mark').textContent = open ? '-' : '+'
    }
    fit()
  })
}

fit()
window.addEventListener('resize', fit)
phone.addEventListener('change', fit)
document.fonts.ready.then(fit)
