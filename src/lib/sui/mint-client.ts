'use client'

import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'

export async function mintFaceOwnershipNFT(params: {
  suiClient: SuiClient
  packageId: string
  faceHash: string
  walrusBlobId: string
  signAndExecuteTransaction: any
}) {
  const { suiClient, packageId, faceHash, walrusBlobId, signAndExecuteTransaction } = params

  const tx = new Transaction()

  const registrationDate = Date.now()

  tx.moveCall({
    target: `${packageId}::faceguard::mint_ownership`,
    arguments: [
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(faceHash))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(walrusBlobId))),
      tx.pure.u64(registrationDate),
    ],
  })

  const result = await signAndExecuteTransaction({
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  })

  const createdObject = result.objectChanges?.find(
    (obj: any) => obj.type === 'created' && obj.objectType?.includes('FaceOwnershipNFT')
  )

  if (!createdObject || createdObject.type !== 'created') {
    throw new Error('Failed to mint NFT')
  }

  return createdObject.objectId
}
