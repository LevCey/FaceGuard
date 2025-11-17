'use client'

import { useState, useRef } from 'react'
import { Search, Upload, Loader2, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ConnectWallet } from '@/components/ConnectWallet'
import { useSuiClient } from '@mysten/dapp-kit'

type VerificationStatus = 'idle' | 'checking' | 'found' | 'not-found' | 'error'

interface FoundNFT {
  objectId: string
  owner: string
  faceHash: string
  registrationDate: number
  walrusBlobId: string
}

export default function VerifyPage() {
  const suiClient = useSuiClient()
  const [status, setStatus] = useState<VerificationStatus>('idle')
  const [image, setImage] = useState<string | null>(null)
  const [foundNFT, setFoundNFT] = useState<FoundNFT | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchedHash, setSearchedHash] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setError(null)
    setFoundNFT(null)
    setStatus('idle')

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setImage(imageUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleVerify = async () => {
    if (!image) {
      setError('Please upload an image first')
      return
    }

    setStatus('checking')
    setError(null)
    setFoundNFT(null)

    try {
      // Convert image to blob for hashing
      const response = await fetch(image)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()

      // Generate face hash (same as registration)
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const faceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      setSearchedHash(faceHash)
      console.log('Searching for face hash:', faceHash)

      const packageId = process.env.NEXT_PUBLIC_FACEGUARD_PACKAGE_ID ||
                       '0x6bf6f69adf6e5cf1d69ffc43e346de907aecdad4ef211632cd0d5d60eb5c5cf2'

      // Query all FaceOwnershipNFT objects (this is simplified - in production you'd use indexed queries)
      // For now, we'll use a dynamic field query or fetch from a known registry

      // Since we don't have a global registry query, we'll use the contract's shared registry object
      const registryId = '0x' + packageId.slice(2, 18) // Simplified - you'd get this from deployment

      // Alternative: Query recent transactions for mint events
      // For demo: we'll try to query objects by type
      const allObjects = await suiClient.queryEvents({
        query: {
          MoveEventType: `${packageId}::faceguard::FaceRegistered`,
        },
        limit: 50,
      })

      console.log('Events found:', allObjects)

      // Check if any event matches our face hash
      let matchFound = false
      let matchedNFT: FoundNFT | null = null

      for (const event of allObjects.data) {
        const parsedEvent = event.parsedJson as any
        if (parsedEvent && parsedEvent.face_hash === faceHash) {
          matchFound = true

          // Fetch the NFT object details
          const nftObject = await suiClient.getObject({
            id: parsedEvent.nft_id,
            options: {
              showContent: true,
              showOwner: true,
            },
          })

          if (nftObject.data?.content && 'fields' in nftObject.data.content) {
            const fields = nftObject.data.content.fields as any
            const owner = nftObject.data.owner

            matchedNFT = {
              objectId: parsedEvent.nft_id,
              owner: typeof owner === 'object' && 'AddressOwner' in owner ? owner.AddressOwner : 'Unknown',
              faceHash: fields.face_hash || faceHash,
              registrationDate: parseInt(fields.registration_date || '0'),
              walrusBlobId: fields.walrus_blob_id || '',
            }
          }
          break
        }
      }

      if (matchFound && matchedNFT) {
        setFoundNFT(matchedNFT)
        setStatus('found')
      } else {
        setStatus('not-found')
      }

    } catch (err: any) {
      console.error('Verification error:', err)
      setError(err?.message || 'Verification failed. Please try again.')
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <Search className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-white">FaceGuard</span>
            </Link>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-slate-300 hover:text-white transition"
              >
                Dashboard
              </Link>
              <ConnectWallet />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Verify Face Ownership</h1>
          <p className="text-slate-300">
            Check if a face is already registered on the blockchain
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          {status === 'idle' && (
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

              {image && (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={image}
                      alt="Preview"
                      className="w-full max-w-md mx-auto rounded-lg"
                    />
                  </div>
                  <button
                    onClick={handleVerify}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                  >
                    Verify on Blockchain
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-400">{error}</span>
                </div>
              )}
            </div>
          )}

          {status === 'checking' && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-white text-lg mb-2">Checking blockchain...</p>
              <p className="text-slate-400 text-sm">Searching for matching face ownership</p>
            </div>
          )}

          {status === 'found' && foundNFT && (
            <div className="text-center py-12">
              <CheckCircle className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Face Already Registered!</h2>
              <p className="text-slate-300 mb-8">
                This face is already registered on the blockchain
              </p>

              <div className="bg-slate-900/50 rounded-lg p-6 text-left mb-6 space-y-4">
                <div>
                  <p className="text-slate-500 text-sm mb-1">Owner Address:</p>
                  <p className="text-white font-mono text-sm break-all">{foundNFT.owner}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm mb-1">Registration Date:</p>
                  <p className="text-white text-sm">
                    {new Date(foundNFT.registrationDate).toLocaleDateString()} at{' '}
                    {new Date(foundNFT.registrationDate).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm mb-1">Face Hash:</p>
                  <p className="text-white font-mono text-xs break-all bg-slate-800 p-2 rounded">
                    {foundNFT.faceHash}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm mb-1">NFT Object ID:</p>
                  <p className="text-white font-mono text-xs break-all bg-slate-800 p-2 rounded">
                    {foundNFT.objectId}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <a
                  href={`https://suiscan.xyz/testnet/object/${foundNFT.objectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  View on Suiscan
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    setStatus('idle')
                    setImage(null)
                    setFoundNFT(null)
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Check Another
                </button>
              </div>
            </div>
          )}

          {status === 'not-found' && (
            <div className="text-center py-12">
              <XCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Not Registered</h2>
              <p className="text-slate-300 mb-4">
                This face is not registered on the blockchain yet
              </p>

              {searchedHash && (
                <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                  <p className="text-slate-500 text-sm mb-1">Face Hash:</p>
                  <p className="text-slate-300 font-mono text-xs break-all">{searchedHash}</p>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Register This Face
                </Link>
                <button
                  onClick={() => {
                    setStatus('idle')
                    setImage(null)
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Check Another
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-12">
              <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Verification Error</h2>
              <p className="text-slate-300 mb-8">{error}</p>
              <button
                onClick={() => {
                  setStatus('idle')
                  setError(null)
                }}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
