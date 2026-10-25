import socket
import ssl
import json
import urllib.request
import subprocess
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("="*60)
print("1. KIỂM TRA DNS VÀ DOMAIN (hkdkkhome.com & www.hkdkkhome.com)")
print("="*60)

domain = "www.hkdkkhome.com"
apex = "hkdkkhome.com"

# PowerShell Resolve-DnsName
for d in [apex, domain]:
    print(f"\n--- DNS query cho: {d} ---")
    try:
        res = subprocess.run(
            ["powershell", "-Command", f"Resolve-DnsName -Name '{d}' -Type ALL | Select-Object Name, Type, TTL, Section, IPAddress, NameHost, Strings | Format-Table -AutoSize"],
            capture_output=True, text=True, encoding='utf-8', errors='ignore'
        )
        print(res.stdout.strip())
    except Exception as e:
        print("Lỗi DNS:", e)

print("\n" + "="*60)
print("2. KIỂM TRA HTTP HEADERS VÀ VERCEL DEPLOYMENT INFO")
print("="*60)

for url in [f"https://{apex}", f"https://{domain}/legal", f"https://{domain}/api/legal/tt99", f"https://{domain}/api/legal/tt89"]:
    print(f"\n--- Request đến: {url} ---")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            headers = dict(resp.info())
            print(f"Status: {resp.status} {resp.reason}")
            for k, v in headers.items():
                if any(x in k.lower() for x in ['vercel', 'server', 'matched', 'age', 'cache', 'etag', 'location', 'strict', 'content-type']):
                    print(f"  {k}: {v}")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code} {e.reason}")
        for k, v in dict(e.headers).items():
            if any(x in k.lower() for x in ['vercel', 'server', 'matched', 'age', 'cache', 'etag', 'location', 'strict', 'content-type']):
                print(f"  {k}: {v}")
    except Exception as e:
        print("Lỗi fetch:", e)

print("\n" + "="*60)
print("3. KIỂM TRA CHỨNG CHỈ SSL/TLS")
print("="*60)
try:
    ctx = ssl.create_default_context()
    with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
        s.settimeout(5)
        s.connect((domain, 443))
        cert = s.getpeercert()
        print(f"Subject: {cert.get('subject')}")
        print(f"Issuer: {cert.get('issuer')}")
        print(f"Valid from: {cert.get('notBefore')} đến {cert.get('notAfter')}")
        print(f"SANs: {cert.get('subjectAltName')}")
except Exception as e:
    print("Lỗi SSL:", e)

print("\n" + "="*60)
print("4. KIỂM TRA SUPABASE / BACKEND TRÊN LIVE CLIENT BUNDLE")
print("="*60)
try:
    req = urllib.request.Request(f"https://{domain}/legal", headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        # Check script tags
        scripts = re.findall(r'src="(/_next/static/chunks/[^"]+\.js)"', html)
        print(f"Tìm thấy {len(scripts)} chunk scripts trên trang /legal.")
        
        # Check for supabase url and key
        supabase_urls = set(re.findall(r'https://[a-zA-Z0-9_\-]+\.supabase\.co', html))
        anon_keys = set(re.findall(r'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-\.]+', html))
        
        print("Supabase URLs tìm thấy trong HTML:", supabase_urls)
        print("Supabase Anon Keys tìm thấy trong HTML:", len(anon_keys))

        # Check in first 5 chunks if not found in HTML
        for s in scripts[:5]:
            chunk_url = f"https://{domain}{s}"
            try:
                with urllib.request.urlopen(chunk_url, timeout=5) as c_resp:
                    chunk_text = c_resp.read().decode('utf-8', errors='ignore')
                    s_urls = set(re.findall(r'https://[a-zA-Z0-9_\-]+\.supabase\.co', chunk_text))
                    if s_urls:
                        print(f"  Trong chunk {s}: tìm thấy Supabase URL: {s_urls}")
                    s_keys = set(re.findall(r'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-\.]+', chunk_text))
                    if s_keys:
                        print(f"  Trong chunk {s}: tìm thấy Supabase Key: {list(s_keys)[0][:30]}...")
            except Exception:
                pass
except Exception as e:
    print("Lỗi quét bundle:", e)
