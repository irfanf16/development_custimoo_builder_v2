const xhttp = new XMLHttpRequest()
var custimoo_application_suppage_url = '' // used by customizer v1
window.custimoo_app_info = undefined // used by customizer_v2.js
let testing_mode = localStorage.getItem('cutimoo_testing_mode')
xhttp.onload = function () {
  let pageRes = JSON.parse(this.response)
  const s = document.createElement('script')

  let customizer_version = pageRes.customizer_version
  if (customizer_version && customizer_version === 2) {
    s.type = 'module'
    s.src = `https://builder-v2.custimoo.com/widget.js`
    window.custimoo_app_info = pageRes
  } else {
    let build_directory = 'self_staging'
    let build_url = 'devcdn'
    s.src = `https://${build_url}.custimoo.com/${build_directory}/v-customizer.min.js?build=${pageRes.app_version}`
    if (pageRes.is_subpage) {
      let subpage = trimAndreplaceSlashesWithDashes(pageRes.suppage_url)
      custimoo_application_suppage_url = pageRes.suppage_url
    }
  }

  document.body.appendChild(s)
}
xhttp.open('GET', 'https://devapi.custimoo.com/api/get_app_version')
xhttp.setRequestHeader('subpageurl', window.location.pathname)
xhttp.send()

function trimAndreplaceSlashesWithDashes(inputString) {
  let trimmedString = inputString.replace(/^\/+|\/+$/g, '')
  let resultString = trimmedString.replace(/\//g, '-')
  return resultString
}
