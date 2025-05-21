import os
import sys
from logging.config import fileConfig
from alembic import context

# ensure the app package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import your SQLAlchemy engine & Base metadata
from backend.app.database import engine, Base  # noqa: E402

# Alembic Config object
config = context.config
# Interpret the config file for Python logging
fileConfig(config.config_file_name)
# Set target metadata for 'autogenerate'
target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode (emit SQL to stdout)."""
    # Use DATABASE_URL env var for offline SQL generation
    url = os.getenv('DATABASE_URL', 'postgresql://postgres:TeJXojONxNtVCOLXgqyZjYXsUtKXtQMt@metro.proxy.rlwy.net:31187/railway') or config.get_main_option('sqlalchemy.url')
    if not url:
        raise RuntimeError('DATABASE_URL is not set for offline migrations')
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={'paramstyle': 'named'},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode (apply directly to the DB)."""
    connectable = engine
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # uncomment if you need to support schema differences
            # compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
