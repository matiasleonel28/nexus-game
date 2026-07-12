"""Add PriceHistory

Revision ID: eb867690ab6d
Revises: c1a2b3d4e5f6
Create Date: 2026-07-12 16:53:29.245843

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eb867690ab6d'
down_revision: Union[str, None] = 'c1a2b3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('price_history',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('game_id', sa.Integer(), nullable=True),
    sa.Column('store_name', sa.String(), nullable=True),
    sa.Column('price', sa.Float(), nullable=True),
    sa.Column('currency', sa.String(), nullable=True),
    sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.ForeignKeyConstraint(['game_id'], ['games.id'], name="fk_price_history_game_id"),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('price_history', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_price_history_game_id'), ['game_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('price_history', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_price_history_game_id'))

    op.drop_table('price_history')
