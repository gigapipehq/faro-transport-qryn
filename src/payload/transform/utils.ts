function stringify(data: Record<string, string | number>) {
  let line = ''

  Object.keys(data).forEach(key => {
    let value = ''
    let isNull = false

    if (data[key] == null) {
      isNull = true
      value = ''
    } else {
      value = data[key].toString()
    }

    const needsQuoting = value.indexOf(' ') > -1 || value.indexOf('=') > -1
    const needsEscaping = value.indexOf('"') > -1 || value.indexOf('\\') > -1

    if (needsEscaping) value = value.replace(/["\\]/g, '\\$&')
    if (needsQuoting) value = `"${value}"`
    if (value === '' && !isNull) value = '""'

    line += `${key}=${value} `
  })

  return line.substring(0, line.length - 1)
}

export const fmt = {
  stringify,
}
