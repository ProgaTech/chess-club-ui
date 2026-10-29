import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { IAccountFormValues } from '@/components/AccountForm'
import { ClubAccountContext } from '@/lib/club-account'
import type { ClubAccountState, IAccount, Role } from '@/lib/club-account'
import { clubGet, clubPut } from '@/lib/club-api'

interface IAccountResponse {
  account: IAccount | null
  role: Role
  canViewAsMember?: boolean
}

interface IStoredAccount {
  userId: string
  state: Extract<ClubAccountState, { status: 'ready' | 'error' }>
}

interface IClubAccountProviderProps {
  children: ReactNode
}

export function ClubAccountProvider(props: IClubAccountProviderProps) {
  const { children } = props
  const { getToken, isLoaded, isSignedIn, userId } = useAuth()
  const [stored, setStored] = useState<IStoredAccount | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      return
    }

    const signedInUserId = userId
    let cancelled = false

    async function loadAccount() {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }

        const body = await clubGet<IAccountResponse>('/accounts/me', token)
        if (!cancelled) {
          const role = body.role === 'organizer' ? 'organizer' : 'member'
          const canViewAsMember = body.canViewAsMember === true
          setStored({ userId: signedInUserId, state: { status: 'ready', account: body.account, role, canViewAsMember } })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Could not reach the club API.'
          setStored({ userId: signedInUserId, state: { status: 'error', message } })
        }
      }
    }

    void loadAccount()

    return () => {
      cancelled = true
    }
  }, [getToken, isLoaded, isSignedIn, userId])

  async function saveAccount(values: IAccountFormValues): Promise<string | null> {
    if (!userId) {
      return 'Clerk has not issued a session token yet.'
    }
    const signedInUserId = userId

    try {
      const token = await getToken()
      if (!token) {
        return 'Clerk has not issued a session token yet.'
      }

      const saved = await clubPut<IAccount>('/accounts/me', token, {
        name: values.name,
        surname: values.surname,
        chessCom: values.chessCom.trim() || null,
      })
      setStored((current) => {
        const previous = current?.userId === signedInUserId && current.state.status === 'ready' ? current.state : null
        const role = previous?.role ?? 'member'
        const canViewAsMember = previous?.canViewAsMember ?? false
        return { userId: signedInUserId, state: { status: 'ready', account: saved, role, canViewAsMember } }
      })
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not save this account.'
    }
  }

  const state = accountState(isLoaded, isSignedIn, userId, stored)

  return (
    <ClubAccountContext.Provider value={{ state, saveAccount }}>
      {children}
    </ClubAccountContext.Provider>
  )
}

function accountState(
  isLoaded: boolean,
  isSignedIn: boolean | undefined,
  userId: string | null | undefined,
  stored: IStoredAccount | null,
): ClubAccountState {
  if (!isLoaded) {
    return { status: 'loading' }
  }
  if (!isSignedIn || !userId) {
    return { status: 'signed-out' }
  }
  if (!stored || stored.userId !== userId) {
    return { status: 'loading' }
  }
  return stored.state
}
