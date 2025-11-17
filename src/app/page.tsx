import Link from 'next/link'
import { Shield, Lock, Eye, FileCheck, Search } from 'lucide-react'
import { ConnectWallet } from '@/components/ConnectWallet'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-white">FaceGuard</span>
            </div>
            <div className="flex gap-4 items-center">
              <Link
                href="/verify"
                className="px-4 py-2 text-slate-300 hover:text-white transition"
              >
                Verify Face
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-slate-300 hover:text-white transition"
              >
                Dashboard
              </Link>
              <ConnectWallet />
              <Link
                href="/register"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Your Face. Your Proof. Your Protection.
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            In the age of AI, your face is your most valuable asset. FaceGuard helps you prove ownership
            and protect against unauthorized AI-generated content.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-lg transition inline-flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Register Your Face
            </Link>
            <Link
              href="/verify"
              className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white text-lg rounded-lg transition inline-flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Verify Face
            </Link>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 mb-20">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-500/10 border border-blue-500/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Register</h3>
              <p className="text-slate-400">
                Upload your photo. We generate a unique hash and mint an NFT on Sui blockchain as proof of ownership.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500/10 border border-purple-500/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-400">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Store</h3>
              <p className="text-slate-400">
                Your image is permanently stored on Walrus decentralized storage, ensuring it can't be censored or deleted.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-500/10 border border-green-500/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Verify</h3>
              <p className="text-slate-400">
                Check if any face is already registered. Get timestamped proof of ownership for legal protection.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <FeatureCard
            icon={<Lock className="w-12 h-12 text-blue-500" />}
            title="Blockchain Proof"
            description="Timestamped ownership certificate stored immutably on Sui blockchain"
          />
          <FeatureCard
            icon={<FileCheck className="w-12 h-12 text-blue-500" />}
            title="Walrus Storage"
            description="Your photos stored permanently on decentralized, censorship-resistant storage"
          />
          <FeatureCard
            icon={<Eye className="w-12 h-12 text-blue-500" />}
            title="AI Detection"
            description="Monitor the web for unauthorized AI-generated content using your face"
          />
          <FeatureCard
            icon={<Shield className="w-12 h-12 text-blue-500" />}
            title="Legal Toolkit"
            description="DMCA takedown tools and court-admissible evidence at your fingertips"
          />
        </div>

        <div className="mt-20 bg-slate-800/50 border border-slate-700 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-6">The Problem</h2>
          <div className="text-slate-300 space-y-4">
            <p>
              Every day, thousands of photos are scraped to create AI influencers. Real faces are used
              without permission to generate content, build brands, and make money.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>AI influencers earning $10K+/month using stolen faces</li>
              <li>Deepfake content created without consent</li>
              <li>Identity theft and reputation damage</li>
              <li>No legal proof of original ownership</li>
            </ul>
            <p className="font-semibold text-blue-400 mt-6">
              FaceGuard gives you the proof you need to fight back.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  )
}
