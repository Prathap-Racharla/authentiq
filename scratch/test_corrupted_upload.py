import urllib.request
import urllib.error

boundary = '----WebKitBoundaryCorruptedTest'
corrupted_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01CORRUPTED_TRUNCATED_GARBAGE_BYTES"

body = bytearray()
body.extend(f'--{boundary}\r\n'.encode('utf-8'))
body.extend(b'Content-Disposition: form-data; name="file"; filename="corrupted.jpg"\r\n')
body.extend(b'Content-Type: image/jpeg\r\n\r\n')
body.extend(corrupted_bytes)
body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))

headers = {
    'Content-Type': f'multipart/form-data; boundary={boundary}',
    'Content-Length': str(len(body))
}

req = urllib.request.Request('http://127.0.0.1:8000/api/v1/documents/analyze', data=bytes(body), headers=headers, method='POST')
try:
    with urllib.request.urlopen(req) as resp:
        print("STATUS:", resp.status)
except urllib.error.HTTPError as he:
    print("HTTP ERROR CODE:", he.code)
    print("BODY:", he.read().decode('utf-8'))

