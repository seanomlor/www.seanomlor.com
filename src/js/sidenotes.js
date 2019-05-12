/**
 * Given a mediaQuery string and a handler function, attach a listener to the
 * window and call the handler with true|false when the media query changes.
 *
 * @param {mediaQuery} string - representing the media query to watch for
 * @param {handler} function - when media query changed, call with true/false
 *
 */
const addMediaQueryListener = (mediaQuery, handler) => {
  const mediaQueryList = window.matchMedia(mediaQuery)
  mediaQueryList.addListener(e => handler(e.matches))
  mediaQueryList.matches && handler(true)
}

/**
 * Given a sidenotes container element, presumably from left or right aside,
 * and a footnote reference element, presumably from main container, calculate
 * the offsetTop needed for a new sidenote without overlapping existing
 * sidenotes or even content in parent aside.
 *
 * @param {Object} elements
 * @param {Element} elements.sidenotesEl - sidenotes container element
 * @param {Element} elements.footnoteRefEl - footnote reference element
 *
 */
const getOffsetTop = ({ sidenotesEl, footnoteRefEl }) => {
  // minimum offset is this footnoteRefEl.offsetTop
  const footnoteRefOffset = footnoteRefEl.offsetTop

  // get offset + height of last element in sidenotes container's parent
  // this is needed in case there is content above the sidenotes container
  const parentEl = sidenotesEl.offsetParent.lastElementChild
  const parentOffset = sidenotesEl.offsetTop + parentEl.offsetHeight

  // get offset + height of last element in sidenotes container (or 0)
  const lastSidenodeEl = sidenotesEl.lastElementChild
  const lastChildOffset = lastSidenodeEl
    ? lastSidenodeEl.offsetTop + lastSidenodeEl.offsetHeight
    : 0

  // return max value of all three offsets
  return Math.max(footnoteRefOffset, parentOffset, lastChildOffset)
}

/**
 * Returns a function to insert sidenotes, preventing duplicated querySelector
 * calls for sidenote containers.
 */
const createInsertSidenote = () => {
  const leftEl = document.querySelector('#sidenotes-left')
  const rightEl = document.querySelector('#sidenotes-right')

  /**
   * Given a foonote reference element, presumably from main container, build
   * and insert a new sidenote element into the correct side and return the
   * new sidenode element.
   *
   * @param {Element} footnoteRefEl - footnote reference element
   *
   */
  return footnoteRefEl => {
    const [_, number] = footnoteRefEl.id.split('fnref')
    const footnoteId = footnoteRefEl.hash.substr(1)
    const footnoteEl = document.querySelector(`li#${footnoteId}`)
    const sidenotesEl = number % 2 === 0 ? leftEl : rightEl
    const offsetTop = getOffsetTop({ sidenotesEl, footnoteRefEl })

    //create sidenote
    // TODO: add logic when sidenote is > a chosen max height, set height
    // with overflow-y: scroll
    const sidenoteEl = document.createElement('div')
    sidenoteEl.setAttribute('id', `sn${number}`)
    sidenoteEl.setAttribute('class', `sidenote`)
    sidenoteEl.setAttribute('style', `top: ${offsetTop}px;`)
    sidenoteEl.innerHTML = `
      <sup class="sidenote-number">${number}</sup>
      <div class="sidenote-content">
        ${footnoteEl.innerHTML}
      </div>
    `

    // insert sidenote!
    sidenotesEl.appendChild(sidenoteEl)

    // attach event listeners for mouse hovers in both directions
    footnoteRefEl.addEventListener('mouseenter', () => {
      sidenoteEl.classList.add('hover')
    })

    footnoteRefEl.addEventListener('mouseleave', () => {
      sidenoteEl.classList.remove('hover')
    })

    sidenoteEl.addEventListener('mouseenter', () => {
      footnoteRefEl.classList.add('hover')
    })

    sidenoteEl.addEventListener('mouseleave', () => {
      footnoteRefEl.classList.remove('hover')
    })

    return sidenoteEl
  }
}

/**
 * Set a mutable done var to false and add listener to insert sidenotes once,
 * now or whenever asides become visible at min-width breakpoint.
 */
const sidenotes = () => {
  window.onload = () => {
    let done = false
    addMediaQueryListener('(min-width: 1420px)', _e => {
      if (!done) {
        const insertSideNote = createInsertSidenote()
        document.querySelectorAll('sup.footnote-ref a').forEach(insertSideNote)
        done = true
        console.info('sidenotes: done.')
      }
    })
  }
}

export default sidenotes
