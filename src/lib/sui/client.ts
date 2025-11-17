import { SuiClient } from '@mysten/sui/client'
import { getFullnodeUrl } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { fromHex } from '@mysten/sui/utils'

export interface FaceOwnershipNFT {
  id: string
  owner: string
  faceHash: string
  registrationDate: number
  walrusBlobId: string
  metadata: {
    name: string
    description: string
  }
}

export class SuiService {
  private client: SuiClient
  private keypair?: Ed25519Keypair
  private network: 'testnet' | 'mainnet'

  constructor() {
    this.network = (process.env.SUI_NETWORK as 'testnet' | 'mainnet') || 'testnet'
    this.client = new SuiClient({ url: getFullnodeUrl(this.network) })

    if (process.env.SUI_PRIVATE_KEY) {
      // Handle both hex and bech32 (suiprivkey1...) formats
      try {
        if (process.env.SUI_PRIVATE_KEY.startsWith('suiprivkey1')) {
          // Bech32 format - parse directly
          this.keypair = Ed25519Keypair.fromSecretKey(process.env.SUI_PRIVATE_KEY)
        } else {
          // Hex format
          const privateKeyBytes = fromHex(process.env.SUI_PRIVATE_KEY)
          this.keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes)
        }
      } catch (error) {
        console.error('Failed to load private key:', error)
      }
    }
  }

  getClient(): SuiClient {
    return this.client
  }

  async mintFaceOwnershipNFT(params: {
    faceHash: string
    walrusBlobId: string
    ownerAddress: string
  }): Promise<string> {
    if (!this.keypair) {
      throw new Error('Server-side private key not configured. Please use client-side wallet.')
    }

    const tx = new Transaction()

    const nftData = {
      faceHash: params.faceHash,
      walrusBlobId: params.walrusBlobId,
      registrationDate: Date.now(),
      metadata: {
        name: 'FaceGuard Ownership Certificate',
        description: 'Proof of facial identity ownership',
      }
    }

    tx.moveCall({
      target: `${process.env.FACEGUARD_PACKAGE_ID}::faceguard::mint_ownership`,
      arguments: [
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(nftData.faceHash))),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(nftData.walrusBlobId))),
        tx.pure.u64(nftData.registrationDate),
      ],
    })

    const result = await this.client.signAndExecuteTransaction({
      signer: this.keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    })

    const createdObject = result.objectChanges?.find(
      (obj) => obj.type === 'created'
    )

    if (!createdObject || createdObject.type !== 'created') {
      throw new Error('Failed to mint NFT')
    }

    return createdObject.objectId
  }

  async getOwnershipNFT(objectId: string): Promise<FaceOwnershipNFT | null> {
    try {
      const object = await this.client.getObject({
        id: objectId,
        options: { showContent: true },
      })

      if (!object.data || object.data.content?.dataType !== 'moveObject') {
        return null
      }

      const fields = object.data.content.fields as any

      return {
        id: objectId,
        owner: fields.owner || '',
        faceHash: fields.face_hash || '',
        registrationDate: parseInt(fields.registration_date || '0'),
        walrusBlobId: fields.walrus_blob_id || '',
        metadata: {
          name: fields.name || 'FaceGuard Ownership Certificate',
          description: fields.description || '',
        },
      }
    } catch (error) {
      console.error('Error fetching NFT:', error)
      return null
    }
  }

  async getUserNFTs(address: string): Promise<FaceOwnershipNFT[]> {
    const objects = await this.client.getOwnedObjects({
      owner: address,
      options: { showContent: true },
    })

    const nfts: FaceOwnershipNFT[] = []

    for (const obj of objects.data) {
      if (obj.data?.content?.dataType === 'moveObject') {
        const fields = obj.data.content.fields as any
        if (fields.face_hash) {
          nfts.push({
            id: obj.data.objectId,
            owner: address,
            faceHash: fields.face_hash,
            registrationDate: parseInt(fields.registration_date || '0'),
            walrusBlobId: fields.walrus_blob_id,
            metadata: {
              name: fields.name || '',
              description: fields.description || '',
            },
          })
        }
      }
    }

    return nfts
  }
}

export const suiService = new SuiService()
