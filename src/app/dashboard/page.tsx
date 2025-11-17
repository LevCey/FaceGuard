'use client'

import { useState, useEffect } from 'react'
import { Shield, Eye, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ConnectWallet } from '@/components/ConnectWallet'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'

interface Registration {
  id: string
  faceHash: string
  registrationDate: number
  nftId: string
  walrusBlobId: string
}

interface Alert {
  id: string
  url: string
  similarity: number
  detectedAt: number
  status: 'new' | 'reviewing' | 'resolved'
  platform: string
}

export default function DashboardPage() {
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (account?.address) {
      loadData()
    } else {
      setLoading(false)
      setRegistrations([])
    }
  }, [account?.address])

  const loadData = async () => {
    if (!account?.address) return

    try {
      setLoading(true)
      console.log('Fetching NFTs for address:', account.address)

      // Fetch all objects owned by the user
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: account.address,
        options: {
          showContent: true,
          showType: true,
        },
      })

      console.log('Owned objects:', ownedObjects)

      const packageId = process.env.NEXT_PUBLIC_FACEGUARD_PACKAGE_ID ||
                       '0x6bf6f69adf6e5cf1d69ffc43e346de907aecdad4ef211632cd0d5d60eb5c5cf2'

      // Filter for FaceOwnershipNFT objects
      const nfts = ownedObjects.data
        .filter(obj => {
          const type = obj.data?.type
          return type?.includes('FaceOwnershipNFT') || type?.includes(`${packageId}::faceguard`)
        })
        .map(obj => {
          const content = obj.data?.content as any
          const fields = content?.dataType === 'moveObject' ? content.fields : {}

          return {
            id: obj.data?.objectId || '',
            nftId: obj.data?.objectId || '',
            faceHash: fields.face_hash || 'Unknown',
            registrationDate: parseInt(fields.registration_date || '0'),
            walrusBlobId: fields.walrus_blob_id || '',
          }
        })

      console.log('Filtered NFTs:', nfts)
      setRegistrations(nfts)

      // For now, no alerts - this would require a monitoring service
      setAlerts([])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTakedown = async (alertId: string) => {
    try {
      await fetch(`/api/takedown/${alertId}`, { method: 'POST' })
      loadData()
    } catch (error) {
      console.error('Takedown request failed:', error)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-white">FaceGuard</span>
            </Link>
            <div className="flex gap-4">
              <ConnectWallet />
              <Link
                href="/register"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Register New Face
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <StatCard
            icon={<Shield className="w-8 h-8" />}
            label="Protected Faces"
            value={registrations.length}
            color="blue"
          />
          <StatCard
            icon={<Eye className="w-8 h-8" />}
            label="Active Monitoring"
            value={registrations.length}
            color="green"
          />
          <StatCard
            icon={<AlertTriangle className="w-8 h-8" />}
            label="New Alerts"
            value={alerts.filter(a => a.status === 'new').length}
            color="yellow"
          />
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Your Registrations</h2>
            {loading ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
                <p className="text-slate-400">Loading...</p>
              </div>
            ) : registrations.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
                <p className="text-slate-400 mb-4">No registered faces yet</p>
                <Link
                  href="/register"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Register Your First Face
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-white font-semibold">Face Ownership NFT</span>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">
                          Registered on {new Date(reg.registrationDate).toLocaleDateString()} at {new Date(reg.registrationDate).toLocaleTimeString()}
                        </p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Face Hash:</p>
                            <p className="text-slate-300 text-xs font-mono break-all bg-slate-900/50 p-2 rounded">
                              {reg.faceHash}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Walrus Blob ID:</p>
                            <p className="text-slate-300 text-xs font-mono break-all bg-slate-900/50 p-2 rounded">
                              {reg.walrusBlobId}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">NFT Object ID:</p>
                            <p className="text-slate-300 text-xs font-mono break-all bg-slate-900/50 p-2 rounded">
                              {reg.nftId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`https://suiscan.xyz/testnet/object/${reg.nftId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                      >
                        View on Suiscan
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      {!reg.walrusBlobId.startsWith('demo_') && (
                        <a
                          href={`https://aggregator.walrus-testnet.walrus.space/v1/${reg.walrusBlobId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm"
                        >
                          View on Walrus
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Detection Alerts</h2>
            {alerts.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-slate-300">No unauthorized usage detected</p>
                <p className="text-slate-500 text-sm mt-2">We're monitoring the web for you</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-slate-800/50 border border-yellow-500/50 rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          <span className="text-white font-semibold">
                            Potential Match Detected
                          </span>
                          <span className="text-sm text-slate-400">
                            {alert.similarity}% similarity
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">
                          Platform: {alert.platform}
                        </p>
                        <a
                          href={alert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                        >
                          View content
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {alert.status === 'new' && (
                        <button
                          onClick={() => handleTakedown(alert.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
                        >
                          Request Takedown
                        </button>
                      )}
                      {alert.status === 'reviewing' && (
                        <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                          Under Review
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'blue' | 'green' | 'yellow'
}) {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/50',
    green: 'text-green-500 bg-green-500/10 border-green-500/50',
    yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/50',
  }

  return (
    <div className={`border rounded-xl p-6 ${colorClasses[color]}`}>
      <div className="mb-4">{icon}</div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-slate-400">{label}</div>
    </div>
  )
}
