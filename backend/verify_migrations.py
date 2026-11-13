import sqlite3
import json

conn = sqlite3.connect("potter.db")

print("EMERGENCY REQUEST INDEXES:")
indexes = conn.execute(
    "PRAGMA index_list(emergency_requests)"
).fetchall()

for index in indexes:
    print(index)

print("\nLEGAL GRIEVANCE COORDINATOR ROLE:")
roles = conn.execute(
    "SELECT id, name, permissions FROM roles "
    "WHERE lower(name) = 'legal grievance coordinator'"
).fetchall()

for role in roles:
    print("Role ID:", role[0])
    print("Role name:", role[1])
    print("Permissions:", json.loads(role[2]) if role[2] else [])

print("\nCURRENT ALEMBIC VERSION:")
print(conn.execute("SELECT version_num FROM alembic_version").fetchall())

conn.close()