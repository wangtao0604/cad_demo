export function unwrapData(payload) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'data' in payload) {
    return payload.data
  }
  return payload
}

export function unwrapList(payload, keys = []) {
  const data = unwrapData(payload)
  if (Array.isArray(data)) return data
  for (const key of ['items', 'content', ...keys]) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}
