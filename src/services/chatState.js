const LAST_READ_KEY = 'chatLastRead'
const UNREAD_KEY = 'chatUnread'
const LAST_MSG_KEY = 'chatLastMsg'

function readMap(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeMap(key, map) {
  localStorage.setItem(key, JSON.stringify(map))
}

function getPerUser(key, userId) {
  const map = readMap(key)
  return map[userId] || {}
}

function setPerUser(key, userId, data) {
  const map = readMap(key)
  map[userId] = data
  writeMap(key, map)
}

export function getLastRead(userId) {
  return getPerUser(LAST_READ_KEY, userId)
}

export function setLastRead(userId, chatId, ts) {
  const lastRead = getLastRead(userId)
  setPerUser(LAST_READ_KEY, userId, { ...lastRead, [chatId]: ts })
}

export function getUnread(userId) {
  return getPerUser(UNREAD_KEY, userId)
}

export function setUnreadCount(userId, chatId, count) {
  const unread = getUnread(userId)
  const next = { ...unread }
  if (count > 0) {
    next[chatId] = count
  } else {
    delete next[chatId]
  }
  setPerUser(UNREAD_KEY, userId, next)
}

export function getLastMessages(userId) {
  return getPerUser(LAST_MSG_KEY, userId)
}

export function setLastMessage(userId, chatId, msg) {
  const last = getLastMessages(userId)
  setPerUser(LAST_MSG_KEY, userId, { ...last, [chatId]: msg })
}
