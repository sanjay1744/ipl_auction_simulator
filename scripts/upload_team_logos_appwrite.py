import os
import glob
import json
import urllib.request
import urllib.parse
import uuid

APPWRITE_ENDPOINT = os.getenv("APPWRITE_ENDPOINT", "https://sgp.cloud.appwrite.io/v1")
APPWRITE_PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID", "6a5df66d001f02c95596")
APPWRITE_BUCKET_ID = os.getenv("APPWRITE_BUCKET_ID", "6a5df6bf0020c2218f61")

def upload_file_multipart(filepath, file_id):
    url = f"{APPWRITE_ENDPOINT}/storage/buckets/{APPWRITE_BUCKET_ID}/files"
    boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
    
    with open(filepath, "rb") as f:
        file_bytes = f.read()

    filename = os.path.basename(filepath)
    content_type = "image/jpeg" if filename.endswith(".jpg") else "image/png"

    body = []
    # fileId parameter
    body.append(f"--{boundary}".encode("utf-8"))
    body.append(f'Content-Disposition: form-data; name="fileId"'.encode("utf-8"))
    body.append(b"")
    body.append(file_id.encode("utf-8"))

    # file parameter
    body.append(f"--{boundary}".encode("utf-8"))
    body.append(f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode("utf-8"))
    body.append(f'Content-Type: {content_type}'.encode("utf-8"))
    body.append(b"")
    body.append(file_bytes)

    body.append(f"--{boundary}--".encode("utf-8"))
    body.append(b"")

    payload = b"\r\n".join(body)

    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("X-Appwrite-Project", APPWRITE_PROJECT_ID)
    api_key = os.getenv("APPWRITE_API_KEY", "")
    if api_key:
        req.add_header("X-Appwrite-Key", api_key)
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

    try:
        res = urllib.request.urlopen(req)
        resp_data = json.loads(res.read().decode("utf-8"))
        view_url = f"{APPWRITE_ENDPOINT}/storage/buckets/{APPWRITE_BUCKET_ID}/files/{file_id}/view?project={APPWRITE_PROJECT_ID}"
        print(f"SUCCESS: Uploaded {filename} as '{file_id}' -> {view_url}")
        return view_url
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        if "already exists" in err_body.lower() or e.code == 409:
            view_url = f"{APPWRITE_ENDPOINT}/storage/buckets/{APPWRITE_BUCKET_ID}/files/{file_id}/view?project={APPWRITE_PROJECT_ID}"
            print(f"EXISTS: '{file_id}' already exists -> {view_url}")
            return view_url
        print(f"ERROR uploading {filename} ({e.code}): {err_body}")
        return None

def main():
    teams_dir = os.path.join("frontend", "public", "teams")
    if not os.path.exists(teams_dir):
        print(f"Directory {teams_dir} not found!")
        return

    jpg_files = glob.glob(os.path.join(teams_dir, "*.jpg"))
    print(f"Found {len(jpg_files)} team logo files in '{teams_dir}'. Uploading to Appwrite Storage...")

    urls = {}
    for filepath in sorted(jpg_files):
        team_code = os.path.splitext(os.path.basename(filepath))[0].lower()
        file_id = f"team-logo-{team_code}"
        url = upload_file_multipart(filepath, file_id)
        if url:
            urls[team_code] = url

    print("\nSummary of Appwrite Team Logo URLs:")
    print(json.dumps(urls, indent=2))

if __name__ == "__main__":
    main()
