"""add preferred_genres onboarding_dismissed_count abandon_reason

Revision ID: c1a2b3d4e5f6
Revises: b3fde1dbba6c
Create Date: 2026-07-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1a2b3d4e5f6'
down_revision: Union[str, None] = 'b3fde1dbba6c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('preferred_genres', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('onboarding_dismissed_count', sa.Integer(), server_default='0', nullable=False))

    with op.batch_alter_table('games', schema=None) as batch_op:
        batch_op.add_column(sa.Column('abandon_reason', sa.String(length=500), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('games', schema=None) as batch_op:
        batch_op.drop_column('abandon_reason')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('onboarding_dismissed_count')
        batch_op.drop_column('preferred_genres')
