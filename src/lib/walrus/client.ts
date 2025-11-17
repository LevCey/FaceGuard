import axios from 'axios'

export interface WalrusUploadResponse {
  blobId: string
  storedBlob: {
    id: string
    size: number
    encodedSize: number
    cost: number
  }
}

export class WalrusClient {
  private publisherUrl: string
  private aggregatorUrl: string

  constructor() {
    this.publisherUrl = process.env.WALRUS_API_URL || 'https://publisher.walrus-testnet.walrus.space'
    this.aggregatorUrl = process.env.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space'
  }

  async uploadFile(file: Buffer | Blob, epochs: number = 100): Promise<WalrusUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.put(
      `${this.publisherUrl}/v1/store?epochs=${epochs}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return response.data
  }

  async uploadJson(data: any, epochs: number = 100): Promise<WalrusUploadResponse> {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    return this.uploadFile(blob, epochs)
  }

  getFileUrl(blobId: string): string {
    return `${this.aggregatorUrl}/v1/${blobId}`
  }

  async downloadFile(blobId: string): Promise<ArrayBuffer> {
    const response = await axios.get(this.getFileUrl(blobId), {
      responseType: 'arraybuffer',
    })
    return response.data
  }

  async downloadJson<T = any>(blobId: string): Promise<T> {
    const buffer = await this.downloadFile(blobId)
    const text = new TextDecoder().decode(buffer)
    return JSON.parse(text)
  }
}

export const walrusClient = new WalrusClient()
