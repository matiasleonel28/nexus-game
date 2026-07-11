"""Add user profile fields

Revision ID: 80497cf87ebc
Revises: 6d60de085836
Create Date: 2026-07-10 18:11:44.402957

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '80497cf87ebc'
down_revision: Union[str, None] = '6d60de085836'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Solo agregamos las columnas (SQLite no soporta alter column y otras cosas directo así)
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('available_hours_per_week', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('stress_level_tolerance', sa.String(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('stress_level_tolerance')
        batch_op.drop_column('available_hours_per_week')
