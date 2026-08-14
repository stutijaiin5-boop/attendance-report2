import { addDoc, collection, deleteDoc, doc, getDocs, setDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { getAuthInstance, getDb } from '../firebase'

function userPath() {
  const u = getAuthInstance().currentUser
  if (!u) throw new Error('Not signed in')
  return `users/${u.uid}`
}

export async function createSubject({ name, targetPercent, scheduledDays }) {
  const ref = collection(getDb(), `${userPath()}/subjects`)
  return addDoc(ref, {
    name: name.trim(),
    targetPercent: Number(targetPercent),
    scheduledDays,
    createdAt: serverTimestamp(),
  })
}

export async function updateSubject(subjectId, data) {
  const ref = doc(getDb(), `${userPath()}/subjects/${subjectId}`)
  return updateDoc(ref, {
    ...data,
    name: data.name?.trim(),
    targetPercent: Number(data.targetPercent),
    updatedAt: serverTimestamp(),
  })
}

// status null removes the record (unmark); otherwise sets present/absent/cancelled
export async function markAttendance(subjectId, dateKey, status) {
  const ref = doc(getDb(), `${userPath()}/subjects/${subjectId}/records/${dateKey}`)
  if (status === null) return deleteDoc(ref)
  return setDoc(ref, { status }, { merge: true })
}

export async function deleteSubject(subjectId) {
  const db = getDb()
  const base = `${userPath()}/subjects/${subjectId}`

  const snap = await getDocs(collection(db, `${base}/records`))
  if (snap.size > 0) {
    const batch = writeBatch(db)
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
  await deleteDoc(doc(db, base))
}