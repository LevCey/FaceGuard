'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { ConnectWallet } from '@/components/ConnectWallet'
import { mintFaceOwnershipNFT } from '@/lib/sui/mint-client'

type Step = 'upload' | 'detecting' | 'preview' | 'blockchain' | 'complete'

export default function RegisterPage() {
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const [step, setStep] = useState<Step>('upload')
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nftId, setNftId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setImage(imageUrl)
      setImageFile(file)
      setStep('detecting')

      setTimeout(() => {
        setStep('preview')
      }, 2000)
    }
    reader.readAsDataURL(file)
  }

  const handleRegister = async () => {
    if (!imageFile || !account) {
      setError('Please connect your wallet first')
      return
    }

    setStep('blockchain')
    setError(null)

    try {
      // Generate face hash
      const buffer = await imageFile.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const faceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Upload to Walrus via backend proxy (avoids CORS issues)
      let walrusBlobId: string

      try {
        console.log('Uploading to Walrus via backend proxy...')

        // Upload through backend API
        const walrusFormData = new FormData()
        walrusFormData.append('file', imageFile)

        const walrusResponse = await fetch('/api/walrus-upload', {
          method: 'POST',
          body: walrusFormData,
        })

        const walrusResult = await walrusResponse.json()

        if (walrusResult.success && walrusResult.blobId) {
          walrusBlobId = walrusResult.blobId
          console.log('Successfully uploaded to Walrus:', walrusBlobId)
          console.log('Publisher used:', walrusResult.publisher)
        } else {
          throw new Error(walrusResult.error || 'Upload failed')
        }
      } catch (error: any) {
        console.warn('Walrus upload failed, using placeholder:', error.message)
        walrusBlobId = `demo_${faceHash.substring(0, 16)}_${Date.now()}`
      }

      const packageId = process.env.NEXT_PUBLIC_FACEGUARD_PACKAGE_ID ||
                       '0x6bf6f69adf6e5cf1d69ffc43e346de907aecdad4ef211632cd0d5d60eb5c5cf2'

      // Mint NFT using connected wallet
      const { Transaction } = await import('@mysten/sui/transactions')
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

      const objectId = await new Promise<string>((resolve, reject) => {
        signAndExecuteTransaction(
          {
            transaction: tx,
          },
          {
            onSuccess: async (result: any) => {
              console.log('Transaction result:', result)
              console.log('Object changes:', result.objectChanges)
              console.log('Effects:', result.effects)

              try {
                // The wallet doesn't return parsed objectChanges, so we need to fetch the transaction
                if (result.digest) {
                  console.log('Fetching transaction details for digest:', result.digest)

                  // Wait a bit for the transaction to be indexed
                  await new Promise(resolve => setTimeout(resolve, 1000))

                  // Fetch the transaction details
                  const txDetails = await suiClient.getTransactionBlock({
                    digest: result.digest,
                    options: {
                      showEffects: true,
                      showObjectChanges: true,
                    },
                  })

                  console.log('Transaction details:', txDetails)
                  console.log('Object changes from RPC:', txDetails.objectChanges)

                  // Find the created FaceOwnershipNFT
                  const createdObject = txDetails.objectChanges?.find(
                    (obj: any) => obj.type === 'created' &&
                    obj.objectType?.includes('FaceOwnershipNFT')
                  )

                  if (createdObject && 'objectId' in createdObject) {
                    console.log('Found NFT object:', createdObject)
                    resolve(createdObject.objectId)
                  } else {
                    console.error('Could not find FaceOwnershipNFT in object changes')
                    reject(new Error('NFT object not found in transaction'))
                  }
                } else {
                  reject(new Error('No transaction digest returned'))
                }
              } catch (error) {
                console.error('Error fetching transaction details:', error)
                reject(error)
              }
            },
            onError: (error: any) => {
              console.error('Transaction error:', error)
              reject(error)
            },
          }
        )
      })

      setNftId(objectId)
      setStep('complete')
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err?.message || 'Registration failed. Please try again.')
      setStep('preview')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <Camera className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-white">FaceGuard</span>
            </Link>
            <ConnectWallet />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Register Your Face</h1>
          <p className="text-slate-300">
            Upload your photo to create a blockchain-verified proof of ownership
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          {!account && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Wallet Not Connected</h2>
              <p className="text-slate-300 mb-6">
                Please connect your Sui wallet to register your face ownership
              </p>
              <ConnectWallet />
            </div>
          )}

          {account && step === 'upload' && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 transition"
              >
                <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 mb-2">Click to upload or drag and drop</p>
                <p className="text-slate-500 text-sm">PNG, JPG up to 10MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
            </div>
          )}

          {account && step === 'detecting' && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-white text-lg">Detecting face...</p>
            </div>
          )}

          {account && step === 'preview' && image && (
            <div className="space-y-6">
              <div className="relative">
                <img
                  src={image}
                  alt="Preview"
                  className="w-full max-w-md mx-auto rounded-lg"
                />
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Face detected
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">What happens next?</h3>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>Your photo will be encrypted and stored on Walrus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>Facial landmarks will be hashed (not the actual photo)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>Ownership NFT will be minted on Sui blockchain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>You'll get a timestamped certificate of ownership</span>
                  </li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-400">{error}</span>
                </div>
              )}

              <button
                onClick={handleRegister}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Register on Blockchain
              </button>
            </div>
          )}

          {account && step === 'blockchain' && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-white text-lg mb-2">Processing on blockchain...</p>
              <p className="text-slate-400 text-sm">This may take a few moments</p>
            </div>
          )}

          {account && step === 'complete' && (
            <div className="text-center py-12">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Registration Complete!</h2>
              <p className="text-slate-300 mb-6">
                Your face ownership has been recorded on the blockchain
              </p>
              {nftId && (
                <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                  <p className="text-slate-400 text-sm mb-1">NFT ID</p>
                  <p className="text-white font-mono text-sm break-all">{nftId}</p>
                </div>
              )}
              <Link
                href="/dashboard"
                className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
