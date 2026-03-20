;(function () {
  // Prevent re-initialization when script is executed again (e.g. on resize or re-inject by parent page)
  if (window.__custimoo_self_build_loaded__) {
    location.reload()
    return
  }
  window.__custimoo_self_build_loaded__ = true

  window.custimoo_application_suppage_url = '' // used by customizer v1
  window.custimoo_app_info = undefined // used by customizer_v2.js

  var custimoo_xhttp = new XMLHttpRequest()
  var testing_mode = localStorage.getItem('custimoo_testing_mode')

  function trimAndreplaceSlashesWithDashes(inputString) {
    var trimmedString = inputString.replace(/^\/+|\/+$/g, '')
    var resultString = trimmedString.replace(/\//g, '-')
    return resultString
  }

  custimoo_xhttp.onload = function () {
    var pageRes = JSON.parse(this.response)
    var s = document.createElement('script')
    var customizer_version = pageRes.customizer_version

    if (customizer_version && customizer_version === 2) {
      s.type = 'module'
      s.src = 'https://cdn.custimoo.com/v2/widget.js?build=' + pageRes.app_version
      s.crossOrigin = 'anonymous'
      window.custimoo_app_info = pageRes
      if (testing_mode && (pageRes.testing_mode == 'true' || pageRes.testing_mode)) {
        s.src = 'https://builder-v2.custimoo.com/widget.js?build=' + pageRes.app_version
      }
    } else {
      var build_directory = 'self'
      var build_url = 'cdn'
      if (testing_mode && (pageRes.testing_mode == 'true' || pageRes.testing_mode)) {
        build_directory = 'self_staging'
        build_url = 'devcdn'
      }
      s.src =
        'https://' +
        build_url +
        '.custimoo.com/' +
        build_directory +
        '/v-customizer.min.js?build=' +
        pageRes.app_version
      s.crossOrigin = 'anonymous'
      if (pageRes.is_subpage) {
        window.custimoo_application_suppage_url = pageRes.suppage_url
      }
    }

    document.body.appendChild(s)
  }
  custimoo_xhttp.open('GET', 'https://api.custimoo.com/api/get_app_version')
  custimoo_xhttp.setRequestHeader('subpageurl', window.location.pathname)
  custimoo_xhttp.send()
})()
