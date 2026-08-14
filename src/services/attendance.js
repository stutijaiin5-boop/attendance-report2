import { addDoc, collection, deleteDoc, doc, getDocs, setDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { getAuthInstance, getDb } from '../firebase'

function userPath() {
  const u = getAuthInstance().currentUser
  if (!u) throw new Error('Not signed in')
  return `users/${u.uid}`
}

export async function createCard(name) {
  const ref = collection(getDb(), `${userPath()}/cards`)
  return addDoc(ref, {
    name: name.trim(),
    createdAt: serverTimestamp(),
  })
}

export async function renameCard(cardId, name) {
  const ref = doc(getDb(), `${userPath()}/cards/${cardId}`)
  return updateDoc(ref, { name: name.trim(), updatedAt: serverTimestamp() })
}

export async function deleteCard(cardId) {
  const db = getDb()
  const base = `${userPath()}/cards/${cardId}`

  const snap = await getDocs(collection(db, `${base}/attendance`))
  if (snap.size > 0) {
    const batch = writeBatch(db)
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
  await deleteDoc(doc(db, base))
}

// data: { status, otHours, note } — merged into the day record
export async function setAttendance(cardId, dateKey, data) {
  const ref = doc(getDb(), `${userPath()}/cards/${cardId}/attendance/${dateKey}`)
  return setDoc(ref, data, { merge: true })
}

export async function clearAttendance(cardId, dateKey) {
  const ref = doc(getDb(), `${userPath()}/cards/${cardId}/attendance/${dateKey}`)
  return deleteDoc(ref)
}