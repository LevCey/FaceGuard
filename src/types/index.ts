export interface FaceRegistration {
  id: string
  userId: string
  faceHash: string
  walrusBlobId: string
  suiNFTId: string
  registrationDate: number
  status: 'pending' | 'verified' | 'rejected'
}

export interface DetectionAlert {
  id: string
  userId: string
  faceRegistrationId: string
  detectedUrl: string
  detectedAt: number
  similarity: number
  status: 'new' | 'reviewed' | 'takedown_requested' | 'resolved'
  metadata: {
    platform: string
    accountName?: string
    contentType: 'image' | 'video' | 'ai_generated'
  }
}

export interface User {
  id: string
  walletAddress: string
  email?: string
  registrations: FaceRegistration[]
  alerts: DetectionAlert[]
  subscription: 'free' | 'premium' | 'pro'
}

export interface WalrusMetadata {
  blobId: string
  size: number
  uploadDate: number
  contentType: string
}
