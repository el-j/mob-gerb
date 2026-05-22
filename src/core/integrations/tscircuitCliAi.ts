import { exportProjectToTscircuitCircuitJson } from '../exporters'
import type { FootprintProject } from '../types/pcb'

export type CliScriptOptions = {
  packageName?: string
  registryUrl?: string
  outputFile?: string
}

const toSafeFileStem = (value: string): string =>
  value.replace(/[^a-zA-Z0-9._-]/g, '_')

export const createTscircuitCliScript = (
  project: FootprintProject,
  options: CliScriptOptions = {},
): string => {
  const packageName = options.packageName?.trim() || project.projectId
  const registryUrl = options.registryUrl?.trim() || 'https://registry.tscircuit.com'
  const outputFile = options.outputFile?.trim() || `${toSafeFileStem(packageName)}.circuit.json`
  const circuitJson = exportProjectToTscircuitCircuitJson(project)

  return [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    `PACKAGE_NAME="${packageName}"`,
    `REGISTRY_URL="${registryUrl}"`,
    `OUTPUT_FILE="${outputFile}"`,
    '',
    "cat > \"$OUTPUT_FILE\" <<'JSON'",
    JSON.stringify(circuitJson, null, 2),
    'JSON',
    '',
    'echo "Publishing $OUTPUT_FILE to $REGISTRY_URL as $PACKAGE_NAME"',
    'npx tscircuit registry publish --name "$PACKAGE_NAME" --file "$OUTPUT_FILE" --registry "$REGISTRY_URL"',
    '',
  ].join('\n')
}

const countByRole = (project: FootprintProject) => {
  const roleCounts = {
    connector: 0,
    copperSurface: 0,
    silkscreen: 0,
    other: 0,
  }

  for (const element of Object.values(project.elements)) {
    if (element.role === 'connector') {
      roleCounts.connector += 1
    } else if (element.role === 'copper-surface') {
      roleCounts.copperSurface += 1
    } else if (element.role === 'silkscreen') {
      roleCounts.silkscreen += 1
    } else {
      roleCounts.other += 1
    }
  }

  return roleCounts
}

export const createAiFootprintPrompt = (
  project: FootprintProject,
  goal: string,
): string => {
  const roleCounts = countByRole(project)
  const circuitJson = exportProjectToTscircuitCircuitJson(project)

  return [
    'You are generating a tscircuit-compatible footprint update for mob-gerb.',
    '',
    `Goal: ${goal.trim() || 'Improve this footprint for manufacturing readiness.'}`,
    `Project: ${project.metadata.name} (${project.projectId})`,
    `Author: ${project.metadata.author || 'unknown'}`,
    `Layer count: ${project.layerCount}`,
    `Element counts: connectors=${roleCounts.connector}, copperSurface=${roleCounts.copperSurface}, silkscreen=${roleCounts.silkscreen}, other=${roleCounts.other}`,
    '',
    'Output requirements:',
    '- Return JSON only.',
    '- Return a valid circuit-json array.',
    '- Preserve connector identifiers when possible.',
    '- Keep all geometry in millimeter space.',
    '',
    'Current circuit-json snapshot (first 20 elements):',
    JSON.stringify(circuitJson.slice(0, 20), null, 2),
  ].join('\n')
}
