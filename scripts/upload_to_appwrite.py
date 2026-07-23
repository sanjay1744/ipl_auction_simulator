import os
import glob
import psycopg2
from appwrite.client import Client
from appwrite.services.storage import Storage
from appwrite.input_file import InputFile

# Appwrite Storage Bucket Credentials
APPWRITE_ENDPOINT = os.getenv("APPWRITE_ENDPOINT", "https://sgp.cloud.appwrite.io/v1")
APPWRITE_PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID", "6a5df66d001f02c95596")
APPWRITE_BUCKET_ID = os.getenv("APPWRITE_BUCKET_ID", "6a5df6bf0020c2218f61")
APPWRITE_API_KEY = os.getenv("APPWRITE_API_KEY", "")

# Neon PostgreSQL connection string
DB_CONN_STR = os.getenv("DB_CONN_STR", "Host=ep-rapid-lab-az8yvbrm-pooler.c-3.ap-southeast-1.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=npg_duj5WX6peqnv;SSL Mode=Require;Trust Server Certificate=true;")

def get_appwrite_file_url(file_id):
    return f"{APPWRITE_ENDPOINT}/storage/buckets/{APPWRITE_BUCKET_ID}/files/{file_id}/view?project={APPWRITE_PROJECT_ID}"

def upload_photos_to_appwrite():
    client = Client()
    client.set_endpoint(APPWRITE_ENDPOINT)
    client.set_project(APPWRITE_PROJECT_ID)
    if APPWRITE_API_KEY:
        client.set_key(APPWRITE_API_KEY)

    storage = Storage(client)

    # 1. Structured Upload for Team Logos (team-logo-{code})
    team_logo_dir = os.path.join("frontend", "public", "teams")
    if os.path.exists(team_logo_dir):
        team_files = sorted(glob.glob(os.path.join(team_logo_dir, "*.jpg")))
        print(f"\n[Appwrite Storage] Uploading {len(team_files)} Team Logos to Bucket '{APPWRITE_BUCKET_ID}'...")
        for filepath in team_files:
            code = os.path.splitext(os.path.basename(filepath))[0].lower()
            file_id = f"team-logo-{code}"
            try:
                storage.create_file(
                    bucket_id=APPWRITE_BUCKET_ID,
                    file_id=file_id,
                    file=InputFile.from_path(filepath)
                )
                print(f"  + Uploaded Team Logo: {code} -> {file_id}")
            except Exception as e:
                print(f"  * Team Logo {file_id}: {str(e)[:70]}")

    # 2. Structured Upload for Player Photos ({id}-{name})
    photo_dir = "ipl_player_photo"
    if os.path.exists(photo_dir):
        photo_files = sorted(glob.glob(os.path.join(photo_dir, "*.jpg")))
        print(f"\n[Appwrite Storage] Uploading {len(photo_files)} Player Photos to Bucket '{APPWRITE_BUCKET_ID}'...")
        url_map = {}
        for index, filepath in enumerate(photo_files, 1):
            filename = os.path.basename(filepath)
            file_id = os.path.splitext(filename)[0].lower().replace("_", "-")
            if len(file_id) > 36:
                file_id = file_id[:36]

            view_url = get_appwrite_file_url(file_id)
            try:
                storage.create_file(
                    bucket_id=APPWRITE_BUCKET_ID,
                    file_id=file_id,
                    file=InputFile.from_path(filepath)
                )
                url_map[filename] = view_url
                print(f"  [{index}/{len(photo_files)}] Uploaded Player Photo: {filename} -> {file_id}")
            except Exception as e:
                url_map[filename] = view_url
                print(f"  [{index}/{len(photo_files)}] Handled {file_id}: {str(e)[:60]}")

        if url_map and DB_CONN_STR:
            update_database_urls(url_map)

def update_database_urls(url_map):
    try:
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
                appwrite_url = get_appwrite_file_url(file_id)
                cur.execute("UPDATE players SET image_url = %s WHERE id = %s;", (appwrite_url, p_id))
                updated_count += cur.rowcount

        conn.commit()
        print(f"\n[Database Sync] Successfully updated image_url to Appwrite Storage for {updated_count} players in PostgreSQL.")

        cur.close()
        conn.close()
    except Exception as err:
        print(f"[Database Sync Warning] Could not sync DB image URLs: {err}")

if __name__ == "__main__":
    upload_photos_to_appwrite()
