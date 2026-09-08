"""Database migration script for Kelana AI."""
import sys
import os
from database import engine, Base
from models.user import User
from models.trip import Trip
from models.conversation import Conversation, Message
from sqlalchemy import inspect

def run_migrations():
    print("=" * 60)
    print("Kelana AI - Database Migration")
    print("=" * 60)
    # Mask password in URL for display
    db_url_repr = str(engine.url)
    if "@" in db_url_repr:
        prefix, suffix = db_url_repr.split("@", 1)
        scheme_user = prefix.split(":")[0] + "://***"
        masked_url = f"{scheme_user}@{suffix}"
    else:
        masked_url = db_url_repr
    print(f"Target Database: {masked_url}")
    
    print("\nRegistering models:")
    for model in [User, Trip, Conversation, Message]:
        print(f"  • {model.__name__} -> table '{model.__tablename__}'")

    print("\nRunning Base.metadata.create_all()...")
    Base.metadata.create_all(bind=engine)
    print("Schema synchronization complete!")

    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\nTables present in database ({len(tables)}):")
    for t in sorted(tables):
        cols = inspector.get_columns(t)
        col_names = [f"{c['name']} ({c['type']})" for c in cols]
        print(f"  • {t}:")
        print(f"      columns: {', '.join(col_names)}")

    print("\nMigration completed successfully!")

if __name__ == "__main__":
    try:
        run_migrations()
    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}", file=sys.stderr)
        sys.exit(1)
