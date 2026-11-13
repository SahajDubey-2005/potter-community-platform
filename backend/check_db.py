import sqlite3

conn = sqlite3.connect("potter.db")

print("Database integrity:", conn.execute(
    "PRAGMA integrity_check"
).fetchone()[0])

print("\nDatabase tables:")
tables = conn.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
)

for table in tables:
    print("-", table[0])

conn.close()