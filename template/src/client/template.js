const expand = text => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
}

const emit = ($item, item) => {
  return $item.append(`
    <p style="background-color:#eee;padding:15px;">
      ${expand(item.text)}
    </p>`)
}

const bind = ($item, item) => {
  return $item.dblclick(() => {
    return wiki.textEditor($item, item)
  })
}

if (typeof window !== 'undefined') {
  window.plugins.template = { emit, bind }
}

export const template = typeof window == 'undefined' ? { expand } : undefined
