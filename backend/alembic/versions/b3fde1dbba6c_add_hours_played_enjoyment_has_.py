"""add hours_played enjoyment has_crossplay to games

Revision ID: b3fde1dbba6c
Revises: f1128d62ca32
Create Date: 2026-07-12 01:11:50.549290

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3fde1dbba6c'
down_revision: Union[str, None] = 'f1128d62ca32'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('games', schema=None) as batch_op:
        batch_op.add_column(sa.Column('has_crossplay', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('hours_played', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('enjoyment', sa.Integer(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('games', schema=None) as batch_op:
        batch_op.drop_column('enjoyment')
        batch_op.drop_column('hours_played')
        batch_op.drop_column('has_crossplay')
