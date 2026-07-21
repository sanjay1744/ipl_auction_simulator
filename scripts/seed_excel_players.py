import os
import openpyxl
import psycopg2

EXCEL_PATH = r"IPL_2026_All_Players_Master.xlsx"
SQL_OUTPUT_PATH = os.path.join("db", "seed_players.sql")
DATA_CONTEXT_PATH = os.path.join("backend", "Data", "DataContext.cs")

def generate_player_uuid(player_id):
    return f"00000000-0000-0000-0000-{int(player_id):012d}"

def map_role(excel_role):
    role_map = {
        "Batter": "Batsman",
        "Bowler": "Bowler",
        "All-Rounder": "AllRounder",
        "Wicketkeeper-Batter": "WicketKeeper"
    }
    return role_map.get(excel_role, excel_role)

def calculate_rating(base_price_cr, acquisition_type, is_captain):
    rating = 7.5
    if acquisition_type == "Retained" or base_price_cr >= 2.0:
        rating = 9.0
    elif base_price_cr >= 1.0:
        rating = 8.5
    elif base_price_cr >= 0.5:
        rating = 8.0
    
    if is_captain == "Yes":
        rating += 0.4
        
    return min(9.8, round(rating, 1))

def load_players_from_excel():
    wb = openpyxl.load_workbook(EXCEL_PATH)
    sheet = wb.active
    headers = [cell.value for cell in sheet[1]]
    
    players = []
    for row_idx in range(2, sheet.max_row + 1):
        row = {headers[c]: sheet.cell(row_idx, c + 1).value for c in range(len(headers))}
        
        p_id = row['Player ID']
        uuid_str = generate_player_uuid(p_id)
        name = str(row['Player Name']).strip()
        team = str(row['Team']).strip()
        raw_role = str(row['Role']).strip()
        role = map_role(raw_role)
        batting_style = str(row['Batting Style']).strip()
        bowling_style = str(row['Bowling Style']).strip()
        country = str(row['Nationality']).strip()
        is_overseas = str(row['Overseas']).strip()
        is_wk = str(row['Wicket Keeper']).strip()
        is_captain = str(row['Captain']).strip()
        jersey_no = row['Jersey No']
        age = int(row['Age']) if row['Age'] is not None else 25
        acq_type = str(row['Acquisition Type']).strip()
        base_price_cr = float(row['Base Price'])
        base_price_rs = int(round(base_price_cr * 10000000))
        image_url = str(row['Image URL']).strip()
        
        category = "Capped" if (base_price_cr >= 0.5 or acq_type == "Retained") else "Uncapped"
        rating = calculate_rating(base_price_cr, acq_type, is_captain)
        
        desc = f"IPL 2026 {team} player ({role}). Acquisition: {acq_type}. Base Price: ₹{base_price_cr} Cr."
        if is_captain == "Yes":
            desc += " Team Captain."
            
        players.append({
            "id": uuid_str,
            "numeric_id": p_id,
            "name": name,
            "image_url": image_url,
            "country": country,
            "role": role,
            "batting_style": batting_style,
            "bowling_style": bowling_style,
            "age": age,
            "rating": rating,
            "base_price": base_price_rs,
            "base_price_cr": base_price_cr,
            "category": category,
            "ipl_runs": 0,
            "ipl_wickets": 0,
            "strike_rate": 0.00,
            "economy": 0.00,
            "description": desc
        })
    return players

def generate_sql(players):
    sql_lines = [
        "-- Seed 2026 TATA IPL Players Master Data from IPL_2026_All_Players_Master.xlsx",
        "TRUNCATE TABLE players CASCADE;",
        "",
        "INSERT INTO players (id, name, image_url, country, role, batting_style, bowling_style, age, rating, base_price, category, ipl_runs, ipl_wickets, strike_rate, economy, description, created_at)",
        "VALUES"
    ]
    
    value_lines = []
    for p in players:
        esc_name = p['name'].replace("'", "''")
        esc_desc = p['description'].replace("'", "''")
        esc_bat = p['batting_style'].replace("'", "''")
        esc_bowl = p['bowling_style'].replace("'", "''")
        esc_country = p['country'].replace("'", "''")
        esc_img = p['image_url'].replace("'", "''")
        
        val = (
            f"    ('{p['id']}', '{esc_name}', '{esc_img}', '{esc_country}', '{p['role']}', "
            f"'{esc_bat}', '{esc_bowl}', {p['age']}, {p['rating']}, {p['base_price']:.2f}, "
            f"'{p['category']}', {p['ipl_runs']}, {p['ipl_wickets']}, {p['strike_rate']:.2f}, "
            f"{p['economy']:.2f}, '{esc_desc}', CURRENT_TIMESTAMP)"
        )
        value_lines.append(val)
        
    sql_lines.append(",\n".join(value_lines) + ";\n")
    
    with open(SQL_OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    print(f"Generated {SQL_OUTPUT_PATH} with {len(players)} players.")

def update_datacontext_cs(players):
    with open(DATA_CONTEXT_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Build C# seed string
    csharp_seed_lines = []
    for p in players:
        esc_name = p['name'].replace('"', '\\"')
        esc_desc = p['description'].replace('"', '\\"')
        esc_bat = p['batting_style'].replace('"', '\\"')
        esc_bowl = p['bowling_style'].replace('"', '\\"')
        esc_country = p['country'].replace('"', '\\"')
        esc_img = p['image_url'].replace('"', '\\"')
        
        csharp_seed_lines.append(
            f'                    new Player {{ Id = Guid.Parse("{p["id"]}"), Name = "{esc_name}", ImageUrl = "{esc_img}", Country = "{esc_country}", Role = "{p["role"]}", BattingStyle = "{esc_bat}", BowlingStyle = "{esc_bowl}", Age = {p["age"]}, Rating = {p["rating"]}m, BasePrice = {p["base_price"]}m, Category = "{p["category"]}", IplRuns = {p["ipl_runs"]}, IplWickets = {p["ipl_wickets"]}, StrikeRate = {p["strike_rate"]}m, Economy = {p["economy"]}m, Description = "{esc_desc}" }}'
        )
        
    csharp_hasdata = "entity.HasData(\n" + ",\n".join(csharp_seed_lines) + "\n                );"
    
    # Locate entity.HasData(...) in DataContext.cs
    start_tag = "entity.HasData("
    end_tag = ");"
    
    start_idx = content.find(start_tag)
    if start_idx == -1:
        print("Could not find entity.HasData in DataContext.cs")
        return
        
    # Find matching closing ); for entity.HasData
    end_idx = content.find(end_tag, start_idx)
    if end_idx == -1:
        print("Could not find closing ); for entity.HasData in DataContext.cs")
        return
        
    new_content = content[:start_idx] + csharp_hasdata + content[end_idx + len(end_tag):]
    
    with open(DATA_CONTEXT_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Updated {DATA_CONTEXT_PATH} with {len(players)} players.")

def execute_neon_db_update(players):
    conn_str = "Host=ep-rapid-lab-az8yvbrm-pooler.c-3.ap-southeast-1.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=npg_duj5WX6peqnv;SSL Mode=Require;Trust Server Certificate=true;"
    params = dict(item.split('=', 1) for item in conn_str.rstrip(';').split(';') if '=' in item)
    dsn = f"host={params['Host']} dbname={params['Database']} user={params['Username']} password={params['Password']} sslmode=require"
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    # Truncate existing players table
    cur.execute("TRUNCATE TABLE players CASCADE;")
    print("Truncated existing players table in Neon PostgreSQL.")
    
    # Execute SQL insert for all 244 players
    insert_sql = """
    INSERT INTO players (id, name, image_url, country, role, batting_style, bowling_style, age, rating, base_price, category, ipl_runs, ipl_wickets, strike_rate, economy, description, created_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP);
    """
    
    rows_to_insert = [
        (
            p['id'], p['name'], p['image_url'], p['country'], p['role'],
            p['batting_style'], p['bowling_style'], p['age'], p['rating'],
            p['base_price'], p['category'], p['ipl_runs'], p['ipl_wickets'],
            p['strike_rate'], p['economy'], p['description']
        )
        for p in players
    ]
    
    cur.executemany(insert_sql, rows_to_insert)
    conn.commit()
    
    cur.execute("SELECT COUNT(*) FROM players;")
    count = cur.fetchone()[0]
    print(f"Successfully inserted {count} players into Neon PostgreSQL DB.")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    os.makedirs("scripts", exist_ok=True)
    players = load_players_from_excel()
    print(f"Loaded {len(players)} players from {EXCEL_PATH}.")
    
    generate_sql(players)
    update_datacontext_cs(players)
    execute_neon_db_update(players)
