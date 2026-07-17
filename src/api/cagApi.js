import { http } from './httpClient'
import { unwrapData, unwrapList } from './response'

const datasetPath = (projectId, dataset) => (
  `/projects/${encodeURIComponent(projectId)}/cag-data/${encodeURIComponent(dataset)}`
)

export async function getCagDataset(projectId, dataset) {
  return unwrapList(await http.get(datasetPath(projectId, dataset)), ['rows'])
}

export async function createCagRow(projectId, dataset, row) {
  return unwrapData(await http.post(datasetPath(projectId, dataset), row)) || row
}

export async function updateCagRow(projectId, dataset, rowId, row) {
  const path = `${datasetPath(projectId, dataset)}/${encodeURIComponent(rowId)}`
  return unwrapData(await http.put(path, row)) || { id: rowId, ...row }
}

export async function deleteCagRows(projectId, dataset, ids) {
  return http.delete(datasetPath(projectId, dataset), { body: { ids } })
}
