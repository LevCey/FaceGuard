import * as tf from '@tensorflow/tfjs'
import * as faceDetection from '@tensorflow-models/face-detection'

export interface FaceLandmarks {
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  keypoints: Array<{
    x: number
    y: number
    name: string
  }>
  confidence: number
}

export class FaceDetector {
  private detector: faceDetection.FaceDetector | null = null
  private initialized = false

  async initialize() {
    if (this.initialized) return

    await tf.ready()

    const model = faceDetection.SupportedModels.MediaPipeFaceDetector
    const detectorConfig = {
      runtime: 'tfjs' as const,
      maxFaces: 1,
    }

    this.detector = await faceDetection.createDetector(model, detectorConfig)
    this.initialized = true
  }

  async detectFaces(imageElement: HTMLImageElement | HTMLVideoElement): Promise<FaceLandmarks[]> {
    if (!this.detector) {
      await this.initialize()
    }

    if (!this.detector) {
      throw new Error('Face detector not initialized')
    }

    const predictions = await this.detector.estimateFaces(imageElement)

    return predictions.map(prediction => ({
      boundingBox: {
        x: prediction.box.xMin,
        y: prediction.box.yMin,
        width: prediction.box.width,
        height: prediction.box.height,
      },
      keypoints: prediction.keypoints.map(kp => ({
        x: kp.x,
        y: kp.y,
        name: kp.name || 'unknown',
      })),
      confidence: 1.0,
    }))
  }

  async extractFaceHash(landmarks: FaceLandmarks): Promise<string> {
    const data = JSON.stringify({
      keypoints: landmarks.keypoints.map(kp => ({
        x: Math.round(kp.x * 100) / 100,
        y: Math.round(kp.y * 100) / 100,
      })),
      bbox: {
        w: Math.round(landmarks.boundingBox.width),
        h: Math.round(landmarks.boundingBox.height),
      },
    })

    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return hashHex
  }

  async processImage(imageElement: HTMLImageElement): Promise<{
    faces: FaceLandmarks[]
    hash: string | null
  }> {
    const faces = await this.detectFaces(imageElement)

    if (faces.length === 0) {
      return { faces: [], hash: null }
    }

    const hash = await this.extractFaceHash(faces[0])

    return { faces, hash }
  }

  dispose() {
    if (this.detector) {
      this.detector.dispose()
      this.detector = null
      this.initialized = false
    }
  }
}

export const faceDetector = new FaceDetector()
