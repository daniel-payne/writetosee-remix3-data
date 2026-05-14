/**
 * Recursively formats database records or collections for API response by:
 * 1. Merging JSON 'data' fields into their respective objects.
 * 2. Excluding 'updatedAt' and all keys ending in 'Id' (internal IDs).
 * 3. Excluding any additional keys provided in the extraExclude list.
 * 4. Processing arrays and nested structures automatically.
 */
export function formatData(input: any, extraExclude: string[] = []): any {
  if (input === null || input === undefined) return input

  // Handle Arrays
  if (Array.isArray(input)) {
    return input.map(item => formatData(item, extraExclude))
  }

  // Handle non-objects (primitives)
  if (typeof input !== 'object') {
    return input
  }

  // Handle database records (objects)
  const { data, updatedAt, ...rest } = input
  const result: any = {}

  // Process core keys
  for (const key in rest) {
    if (key.endsWith('Id')) continue
    if (extraExclude.includes(key)) continue
    
    // Recursively format the value
    result[key] = formatData((rest as any)[key], extraExclude)
  }

  // Merge and recursively format 'data' content if present
  if (data !== undefined) {
    const parsedData = typeof data === 'string'
      ? (data.trim() ? JSON.parse(data) : {})
      : (data ?? {})
    
    const formattedData = formatData(parsedData, extraExclude)
    Object.assign(result, formattedData)
  }

  return result
}
