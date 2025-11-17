'use client'

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { Wallet } from 'lucide-react'

export function ConnectWallet() {
  const account = useCurrentAccount()

  return (
    <div className="flex items-center gap-3">
      {account ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg">
            <Wallet className="w-4 h-4 text-blue-500" />
            <span className="text-white text-sm font-mono">
              {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </span>
          </div>
          <ConnectButton className="!px-4 !py-2 !bg-red-600 hover:!bg-red-700 !text-white !rounded-lg !transition" />
        </div>
      ) : (
        <ConnectButton className="!px-4 !py-2 !bg-blue-600 hover:!bg-blue-700 !text-white !rounded-lg !transition !flex !items-center !gap-2">
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </ConnectButton>
      )}
    </div>
  )
}
