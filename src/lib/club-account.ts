import { createContext, useContext } from 'react'
import type { IAccountFormValues } from '@/components/AccountForm'

export interface IAccount {
  id: number
  name: string
  surname: string
  chessCom: string | null
  elo: number
  signupName: string | null
}

export type Role = 'organizer' | 'member'

export type ClubAccountState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'ready'; account: IAccount | null; role: Role; canViewAsMember: boolean }
  | { status: 'error'; message: string }

export interface IClubAccountContext {
  state: ClubAccountState
  saveAccount: (values: IAccountFormValues) => Promise<string | null>
}

export const ClubAccountContext = createContext<IClubAccountContext | null>(null)

export function useClubAccount(): IClubAccountContext {
  const context = useContext(ClubAccountContext)
  if (!context) {
    throw new Error('useClubAccount must be used inside ClubAccountProvider')
  }
  return context
}

// UI hints only. The API enforces the same rules.
export function isOrganizer(state: ClubAccountState): boolean {
  return state.status === 'ready' && state.role === 'organizer'
}

export function canAddMatchGame(state: ClubAccountState, white: string, black: string): boolean {
  if (state.status !== 'ready') {
    return false
  }
  if (state.role === 'organizer') {
    return true
  }
  const account = state.account
  if (!account) {
    return false
  }
  const fullName = `${account.name} ${account.surname}`
  const mine = [fullName, account.signupName ?? '']
    .map((name) => name.replace(/\s+/g, ' ').trim().toLowerCase())
    .filter(Boolean)
  return [white, black].some((player) => mine.includes(player.replace(/\s+/g, ' ').trim().toLowerCase()))
}
