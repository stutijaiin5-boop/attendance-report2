import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { getDb } from '../firebase'

export function useCards() {
  const { user } = useAuth()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCards([])
      setLoading(false)
      return
    }
    const q = query(collection(getDb(), 'users', user.uid, 'cards'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setCards(snap.docs.map((d) => ({ id: d.id, name: d.data().name ?? '', createdAt: d.data().createdAt })))
        setLoading(false)
      },
      (err) => {
        console.error('Failed to load cards', err)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [user?.uid])

  return { cards, loading }
}

export function useAttendance(cardId) {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !cardId) {
      setRecords([])
      setLoading(false)
      return
    }
    const unsubscribe = onSnapshot(
      collection(getDb(), 'users', user.uid, 'cards', cardId, 'attendance'),
      (snap) => {
        setRecords(
          snap.docs.map((d) => ({
            id: d.id,
            date: d.id,
            status: d.data().status ?? null,
            otHours: d.data().otHours ?? null,
            note: d.data().note ?? null,
          })),
        )
        setLoading(false)
      },
      (err) => {
        console.error(`Failed to load attendance for ${cardId}`, err)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [user?.uid, cardId])

  return { records, loading }
}

export function useAllAttendance(cardIds = []) {
  const { user } = useAuth()
  const [recordsByCard, setRecordsByCard] = useState({})
  const [loading, setLoading] = useState(true)
  const idsKey = cardIds.join('|')

  useEffect(() => {
    if (!user) {
      setRecordsByCard({})
      setLoading(false)
      return
    }
    const ids = idsKey ? idsKey.split('|') : []
    if (ids.length === 0) {
      setRecordsByCard({})
      setLoading(false)
      return
    }

    const map = {}
    const unsubs = ids.map((id) =>
      onSnapshot(
        collection(getDb(), 'users', user.uid, 'cards', id, 'attendance'),
        (snap) => {
          map[id] = snap.docs.map((d) => ({
            id: d.id,
            date: d.id,
            status: d.data().status ?? null,
            otHours: d.data().otHours ?? null,
            note: d.data().note ?? null,
          }))
          setRecordsByCard({ ...map })
        },
        (err) => console.error(`Failed to load attendance for ${id}`, err),
      ),
    )
    setLoading(false)
    return () => unsubs.forEach((u) => u())
  }, [user?.uid, idsKey])

  return { recordsByCard, loading }
}