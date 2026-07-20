# IPL Auction Game - Database Setup Guide

This directory contains the database design scripts for the **IPL Auction Game**, designed to run on **Supabase PostgreSQL**.

## Files Overview
1. [schema.sql](file:///d:/Games/ipl_auction_simulator/db/schema.sql): Defines the database schema, including tables for users, rooms, room participants (multiplayer status), teams, players, bids, purchases, chats, and notifications, along with indices.
2. [seed_players.sql](file:///d:/Games/ipl_auction_simulator/db/seed_players.sql): Seeds the master `players` table with 15 famous IPL players (both Indian and Overseas, various base prices and roles) for quick testing and validation.

---

## Setup Instructions

### 1. Set Up Supabase Project
1. Log in to your [Supabase Dashboard](https://supabase.com/).
2. Create a new project (e.g., `ipl-auction-game`).
3. Note your Database Password and connection parameters.

### 2. Apply Database Schema
1. In the Supabase Dashboard, navigate to the **SQL Editor** tab in the left panel.
2. Click **New Query** to open a blank SQL query window.
3. Open [db/schema.sql](file:///d:/Games/ipl_auction_simulator/db/schema.sql), copy its entire contents, and paste it into the Supabase SQL editor.
4. Click the **Run** button (or press `Cmd + Enter` / `Ctrl + Enter`).
5. Verify that the query executes successfully with "Success. No rows returned."

### 3. Seed Master Player Data
1. In the SQL Editor, create another **New Query**.
2. Open [db/seed_players.sql](file:///d:/Games/ipl_auction_simulator/db/seed_players.sql), copy its contents, paste them, and click **Run**.
3. This will seed 15 players with preconfigured UUIDs, statistics, prices, and roles.

---

## Table Relationships and Logic

* **Multiplayer Tracking (`room_participants`)**: Tracks users currently in the lobby/room. SignalR Hub updates `connection_id` and `is_connected` in real-time when clients join, disconnect, or toggles `is_ready`.
* **Teams & Budgets (`teams`)**: Associated with rooms and owners. Tracks remaining budgets (`decimal`) and count of players (to enforce squad and foreign player limits).
* **Bids & Purchases (`bids` & `purchases`)**: Tracks every bid event in real-time. Once a player is sold, a record is added to `purchases`. The `purchases` table prevents duplicate player sales by enforcing a unique constraint on `(room_id, player_id)`.
* **Authentication**: Password hashes are stored locally in the `users` table for custom JWT-based authentication via the ASP.NET Core 9 backend.
