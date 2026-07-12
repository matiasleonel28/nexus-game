"""Add genres column and update statuses

Revision ID: b80e72bb9ebc
Revises: 80497cf87ebc
Create Date: 2026-07-10 19:24:33.041377

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b80e72bb9ebc'
down_revision: Union[str, None] = '80497cf87ebc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('games') as batch_op:
        batch_op.add_column(sa.Column('genres', sa.String(), nullable=True))
    
    # Data migration for statuses
    op.execute("UPDATE games SET status = 'backlog' WHERE status = 'pendiente'")
    op.execute("UPDATE games SET status = 'playing' WHERE status = 'jugando'")
    op.execute("UPDATE games SET status = 'completed' WHERE status = 'completado'")
    op.execute("UPDATE games SET status = 'abandoned' WHERE status = 'abandonado'")


def downgrade() -> None:
    op.execute("UPDATE games SET status = 'pendiente' WHERE status = 'backlog'")
    op.execute("UPDATE games SET status = 'jugando' WHERE status = 'playing'")
    op.execute("UPDATE games SET status = 'completado' WHERE status = 'completed'")
    op.execute("UPDATE games SET status = 'abandonado' WHERE status = 'abandoned'")
    
    with op.batch_alter_table('games') as batch_op:
        batch_op.drop_column('genres')
