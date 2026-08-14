import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { getDb } from '../firebase'

export function useSubjects() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setSubjects([])
      setLoading(false)
      return
    }
    const q = query(
      collection(getDb(), 'users', user.uid, 'subjects'),
      orderBy('createdAt', 'desc'),
    )
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setSubjects(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            targetPercent: d.data().targetPercent ?? 75,
            scheduledDays: d.data().scheduledDays ?? [],
          })),
        )
        setLoading(false)
      },
      (err) => {
        console.error('Failed to load subjects', err)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [user?.uid])

  return { subjects, loading }
}

export function useRecordsForSubjects(subjectIds = []) {
  const { user } = useAuth()
  const [recordsBySubject, setRecordsBySubject] = useState({})
  const [loading, setLoading] = useState(true)
  const idsKey = subjectIds.join('|')

  useEffect(() => {
    if (!user) {
      setRecordsBySubject({})
      setLoading(false)
      return
    }
    const ids = idsKey ? idsKey.split('|') : []
    if (ids.length === 0) {
      setRecordsBySubject({})
      setLoading(false)
      return
    }

    const map = {}
    const unsubs = ids.map((id) =>
      onSnapshot(
        collection(getDb(), 'users', user.uid, 'subjects', id, 'records'),
        (snap) => {
          map[id] = snap.docs.map((d) => ({ id: d.id, date: d.id, status: d.data().status }))
          setRecordsBySubject({ ...map })
        },
        (err) => console.error(`Failed to load records for ${id}`, err),
      ),
    )
    setLoading(false)
    return () => unsubs.forEach((u) => u())
  }, [user?.uid, idsKey])

  return { recordsBySubject, loading }
}