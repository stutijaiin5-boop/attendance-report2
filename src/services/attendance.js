import { addDoc, collection, deleteDoc, doc, getDocs, setDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { getAuthInstance, getDb } from '../firebase'

// Never silently fail on auth: wait until the user is actually signed in,
// then resolve their uid. Throws if no user ever appears.
function waitForUid() {
  const auth = getAuthInstance()
  const current = auth.currentUser
  if (current) return Promise.resolve(current.uid)

  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub()
      if (user) resolve(user.uid)
      else reject(new Error('Not signed in'))
    })
  })
}

async function userPath() {
  const uid = await waitForUid()
  return `users/${uid}`
}

export async function createCard(name) {
  const ref = collection(getDb(), `${await userPath()}/cards`)
  return addDoc(ref, {
    name: name.trim(),
    createdAt: serverTimestamp(),
  })
}

export async function renameCard(cardId, name) {
  const ref = doc(getDb(), `${await userPath()}/cards/${cardId}`)
  return updateDoc(ref, { name: name.trim(), updatedAt: serverTimestamp() })
}

export async function deleteCard(cardId) {
  const db = getDb()
  const base = `${await userPath()}/cards/${cardId}`

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
  const ref = doc(getDb(), `${await userPath()}/cards/${cardId}/attendance/${dateKey}`)
  return setDoc(ref, data, { merge: true })
}

export async function clearAttendance(cardId, dateKey) {
  const ref = doc(getDb(), `${await userPath()}/cards/${cardId}/attendance/${dateKey}`)
  return deleteDoc(ref)
}