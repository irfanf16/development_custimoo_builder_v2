export const CUSTIMOO_APPLICATION_SUBPAGE_URL_KEY = 'custimoo_application_subpage_url'

function trimAndreplaceSlashesWithDashes(inputString: string) {
  const trimmedString = inputString.replace(/^\/+|\/+$/g, '')
  const resultString = trimmedString.replace(/\//g, '-')
  return resultString
}

export function getSanitizedSubPageUrl(subPageUrl: string) {
  return trimAndreplaceSlashesWithDashes(subPageUrl)
}

export function getKeyWithSubPageSuffix(key: string, subPageUrl: string) {
  return `${key}-${getSanitizedSubPageUrl(subPageUrl)}`
}
