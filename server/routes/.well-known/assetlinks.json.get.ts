// App Links: Android opens https://boleia.ao/t/<id> in the app once its signing key is listed here.
const PACKAGE_NAME = 'ao.boleia.app';
// SHA-256 of the certificates the app is signed with
const CERT_FINGERPRINTS = [
  '43:2C:43:AE:89:37:A8:1F:EA:D6:27:7B:E5:3E:D2:E5:83:92:7D:08:0F:3E:43:13:4F:DA:F6:72:46:56:25:87',
];

export default defineEventHandler(() => [{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: { namespace: 'android_app', package_name: PACKAGE_NAME, sha256_cert_fingerprints: CERT_FINGERPRINTS },
}]);
