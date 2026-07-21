import os
import glob
import psycopg2
from appwrite.client import Client
from appwrite.services.storage import Storage
from appwrite.input_file import InputFile

# Appwrite credentials
APPWRITE_ENDPOINT = os.getenv("APPWRITE_ENDPOINT", "https://sgp.cloud.appwrite.io/v1")
APPWRITE_PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID", "6a5df66d001f02c95596")
APPWRITE_BUCKET_ID = os.getenv("APPWRITE_BUCKET_ID", "6a5df6bf0020c2218f61")
APPWRITE_API_KEY = os.getenv("APPWRITE_API_KEY", "")

# Neon PostgreSQL connection string
DB_CONN_STR = "Host=ep-rapid-lab-az8yvbrm-pooler.c-3.ap-southeast-1.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=npg_duj5WX6peqnv;SSL Mode=Require;Trust Server Certificate=true;"

def upload_photos_to_appwrite():
    client = Client()
    client.set_endpoint(APPWRITE_ENDPOINT)
    client.set_project(APPWRITE_PROJECT_ID)
    client.set_key(APPWRITE_API_KEY)

    storage = Storage(client)

    photo_dir = "ipl_player_photo"
    photo_files = sorted(glob.glob(os.path.join(photo_dir, "*.jpg")))
    print(f"Found {len(photo_files)} photos in '{photo_dir}'. Starting upload to Appwrite Bucket '{APPWRITE_BUCKET_ID}'...")

    url_map = {}

    for index, filepath in enumerate(photo_files, 1):
        filename = os.path.basename(filepath)
        # Generate safe file ID for Appwrite (max 36 chars, alphanumeric, hyphens, underscores)
        file_id = os.path.splitext(filename)[0].lower().replace("_", "-")
        if len(file_id) > 36:
            file_id = file_id[:36]

        view_url = f"{APPWRITE_ENDPOINT}/storage/buckets/{APPWRITE_BUCKET_ID}/files/{file_id}/view?project={APPWRITE_PROJECT_ID}"

        try:
            # Upload file to Appwrite bucket
            storage.create_file(
                bucket_id=APPWRITE_BUCKET_ID,
                file_id=file_id,
                file=InputFile.from_path(filepath)
            )
            url_map[filename] = view_url
            print(f"[{index}/{len(photo_files)}] Uploaded {filename} -> {file_id}")
        except Exception as e:
            err_str = str(e)
            if "already exists" in err_str.lower() or "409" in err_str:
                url_map[filename] = view_url
                print(f"[{index}/{len(photo_files)}] File {file_id} already exists in bucket. Using URL.")
            else:
                # Still map view_url if already uploaded
                url_map[filename] = view_url
                print(f"[{index}/{len(photo_files)}] Handled {filename} -> {err_str[:60]}")

    # Update Postgres DB image_urls
    if url_map:
        update_database_urls(url_map)

def update_database_urls(url_map):
    params = dict(item.split('=', 1) for item in DB_CONN_STR.rstrip(';').split(';') if '=' in item)
    dsn = f"host={params['Host']} dbname={params['Database']} user={params['Username']} password={params['Password']} sslmode=require"

    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    cur.execute("SELECT id, name, image_url FROM players;")
    players = cur.fetchall()

    photo_files = glob.glob(os.path.join("ipl_player_photo", "*.jpg"))
    file_map = {}
    for f in photo_files:
        base = os.path.basename(f)
        file_id = os.path.splitext(base)[0].lower().replace("_", "-")
        if len(file_id) > 36:
            file_id = file_id[:36]
        prefix = base.split("_")[0]
        file_map[prefix] = file_id

    updated_count = 0
    for p_id, name, old_url in players:
        num_str = str(int(p_id.split("-")[-1]))
        if num_str in file_map:
            file_id = file_map[num_str]
            appwrite_url = f"{APPWRITE_ENDPOINT}/storage/buckets/{APPWRITE_BUCKET_ID}/files/{file_id}/view?project={APPWRITE_PROJECT_ID}"
            cur.execute("UPDATE players SET image_url = %s WHERE id = %s;", (appwrite_url, p_id))
            updated_count += cur.rowcount

    conn.commit()
    print(f"\nSuccessfully updated image_url for {updated_count} players in PostgreSQL database.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    upload_photos_to_appwrite()
