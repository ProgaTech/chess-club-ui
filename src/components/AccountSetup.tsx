import { useUser } from '@clerk/react'
import type { ReactNode } from 'react'
import { AccountForm } from '@/components/AccountForm'
import type { IAccountFormValues } from '@/components/AccountForm'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useClubAccount } from '@/lib/club-account'

export function AccountSetup() {
  const { state, saveAccount } = useClubAccount()
  const showForm = state.status === 'ready' && !state.account

  if (!showForm) {
    return null
  }

  return (
    <SetupDialog>
      <InitForm onSave={saveAccount} />
    </SetupDialog>
  )
}

interface ISetupDialogProps {
  children: ReactNode
}

function SetupDialog(props: ISetupDialogProps) {
  const { children } = props

  // No onOpenChange: the account has to be saved before the dialog goes away.
  return (
    <Dialog open>
      <DialogContent className="max-h-[min(40rem,calc(100%-2rem))] max-w-3xl overflow-y-auto rounded-lg">
        {children}
      </DialogContent>
    </Dialog>
  )
}

interface IInitFormProps {
  onSave: (values: IAccountFormValues) => Promise<string | null>
}

function InitForm(props: IInitFormProps) {
  const { onSave } = props
  const { user } = useUser()

  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Your account</p>
      <DialogTitle className="mt-3 text-4xl leading-tight">Add your account</DialogTitle>
      <p className="mt-4 text-lg text-muted-foreground">
        This is stored for the Clerk user who is signed in. Elo starts at 1200.
      </p>
      <AccountForm
        autoFocus
        onSave={onSave}
        submitLabel="Save account"
        values={{
          name: user?.firstName ?? '',
          surname: user?.lastName ?? '',
          chessCom: '',
        }}
      />
    </section>
  )
}
