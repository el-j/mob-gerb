import { exportProjectToTscircuitCircuitJson } from '../exporters'
import { parseTscircuitCircuitJson } from '../parsers'
import type { FootprintProject } from '../types/pcb'

export type RegistryFetch = (input: string, init?: RequestInit) => Promise<Response>

export type RegistryPublishPayload = {
  packageName: string
  createdAt: string
  source: 'mob-gerb'
  metadata: {
    projectId: string
    name: string
    author: string
    layerCount: number
  }
  circuitJson: unknown[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const extractCircuitJsonArray = (payload: unknown): unknown[] | null => {
  if (Array.isArray(payload)) return payload
  if (!isRecord(payload)) return null

  const candidates = [
    payload.circuitJson,
    payload.circuit_json,
    payload.data,
    isRecord(payload.package) ? payload.package.circuitJson : undefined,
    isRecord(payload.package) ? payload.package.circuit_json : undefined,
    isRecord(payload.part) ? payload.part.circuitJson : undefined,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  return null
}

export const fetchRegistryCircuitJson = async (
  packageNameOrUrl: string,
  fetchImpl: RegistryFetch,
): Promise<unknown[]> => {
  const input = packageNameOrUrl.trim()
  if (!input) {
    throw new Error('Package name or URL is required')
  }

  const isUrl = /^https?:\/\//i.test(input)
  const endpoint = isUrl
    ? input
    : `https://registry.tscircuit.com/api/packages/${encodeURIComponent(input)}/circuit-json`

  const response = await fetchImpl(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Registry request failed (${response.status})`)
  }

  const payload = (await response.json()) as unknown
  const circuitJson = extractCircuitJsonArray(payload)
  if (!circuitJson) {
    throw new Error('Registry response did not include a circuit-json array')
  }

  return circuitJson
}

export const importProjectFromRegistryCircuitJson = (
  circuitJson: unknown[],
  options?: { packageName?: string },
): FootprintProject =>
  parseTscircuitCircuitJson(circuitJson, {
    projectId: options?.packageName ? `registry-${options.packageName}` : 'registry-import',
    projectName: options?.packageName ? `Registry: ${options.packageName}` : 'Registry Import',
  })

export const createRegistryPublishPayload = (
  project: FootprintProject,
  packageName: string,
): RegistryPublishPayload => ({
  packageName: packageName.trim() || project.projectId,
  createdAt: new Date().toISOString(),
  source: 'mob-gerb',
  metadata: {
    projectId: project.projectId,
    name: project.metadata.name,
    author: project.metadata.author,
    layerCount: project.layerCount ?? 2,
  },
  circuitJson: exportProjectToTscircuitCircuitJson(project),
})
