"""initial postgres schema

Revision ID: 0001_initial
Revises: 
Create Date: 2026-09-10 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('username', sa.String(100), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False, server_default=''),
        sa.Column('salt', sa.String(64), nullable=False, server_default=''),
        sa.Column('name', sa.String(150), nullable=False),
        sa.Column('email', sa.String(150), unique=True, nullable=False),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('department', sa.String(100), nullable=False),
        sa.Column('designation', sa.String(200), nullable=False),
        sa.Column('zone', sa.String(100), server_default='Northern Railway'),
        sa.Column('division', sa.String(100), server_default='Delhi Division'),
        sa.Column('avatar', sa.String(10), server_default='IR'),
        sa.Column('permissions', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('last_login', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_role', 'users', ['role'])

    # 2. corridors
    op.create_table(
        'corridors',
        sa.Column('code', sa.String(50), primary_key=True),
        sa.Column('name', sa.String(150), nullable=False),
        sa.Column('zone', sa.String(100), nullable=False),
        sa.Column('division', sa.String(100), server_default='Delhi Division'),
        sa.Column('lines', sa.JSON(), nullable=False),
        sa.Column('length_km', sa.Float(), server_default='50.0'),
        sa.Column('max_speed', sa.Integer(), server_default='130'),
        sa.Column('track_count', sa.Integer(), server_default='2'),
    )
    op.create_index('ix_corridors_code', 'corridors', ['code'])

    # 3. corridor_windows
    op.create_table(
        'corridor_windows',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('corridor', sa.String(50), sa.ForeignKey('corridors.code', ondelete='CASCADE'), nullable=False),
        sa.Column('line', sa.String(100), server_default='UP Main'),
        sa.Column('date', sa.String(50), nullable=False),
        sa.Column('start_time', sa.String(20), nullable=False),
        sa.Column('end_time', sa.String(20), nullable=False),
        sa.Column('duration_hours', sa.Float(), nullable=False),
        sa.Column('window_type', sa.String(50), server_default='Night Corridor'),
        sa.Column('status', sa.String(50), server_default='Available'),
        sa.Column('traffic_density', sa.String(100), server_default='Low (Night non-suburban)'),
        sa.Column('occupancy_before', sa.String(200), nullable=True),
        sa.Column('occupancy_after', sa.String(200), nullable=True),
        sa.Column('suitable_tasks', sa.JSON(), nullable=True),
        sa.Column('conflict_count', sa.Integer(), server_default='0'),
        sa.Column('train_impact', sa.String(100), server_default='Low / Zero Passenger Delay'),
    )
    op.create_index('ix_corridor_windows_id', 'corridor_windows', ['id'])
    op.create_index('ix_corridor_windows_corridor', 'corridor_windows', ['corridor'])
    op.create_index('ix_corridor_windows_date', 'corridor_windows', ['date'])
    op.create_index('ix_corridor_windows_status', 'corridor_windows', ['status'])

    # 4. tasks
    op.create_table(
        'tasks',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('source', sa.String(50), server_default='MANUAL'),
        sa.Column('department', sa.String(100), nullable=False),
        sa.Column('defect_type', sa.String(150), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('location', sa.String(200), nullable=False),
        sa.Column('corridor', sa.String(50), sa.ForeignKey('corridors.code', ondelete='RESTRICT'), nullable=False),
        sa.Column('severity', sa.String(50), server_default='Medium'),
        sa.Column('severity_weight', sa.Integer(), server_default='2'),
        sa.Column('overdue_days', sa.Integer(), server_default='0'),
        sa.Column('priority_score', sa.Integer(), server_default='50'),
        sa.Column('status', sa.String(50), server_default='Pending'),
        sa.Column('requested_date', sa.String(50), nullable=True),
        sa.Column('preferred_window', sa.String(100), nullable=True),
        sa.Column('duration_hours', sa.Float(), server_default='2.0'),
        sa.Column('requires_power_block', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('requires_traffic_block', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('speed_restriction_kmph', sa.Integer(), server_default='30'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.String(100), server_default='system'),
        sa.Column('created_by_user_id', sa.String(50), nullable=True),
        sa.Column('created_by_name', sa.String(150), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('division_id', sa.String(50), nullable=True),
        sa.Column('section_name', sa.String(100), nullable=True),
        sa.Column('line_type', sa.String(50), nullable=True),
        sa.Column('station_from', sa.String(50), nullable=True),
        sa.Column('station_to', sa.String(50), nullable=True),
        sa.Column('nominated_date', sa.String(50), nullable=True),
        sa.Column('planned_start_time', sa.String(20), nullable=True),
        sa.Column('planned_end_time', sa.String(20), nullable=True),
        sa.Column('demanded_duration_mins', sa.Integer(), server_default='180'),
        sa.Column('demanded_time', sa.String(50), nullable=True),
        sa.Column('granted_time', sa.String(50), nullable=True),
        sa.Column('actual_start_time', sa.String(50), nullable=True),
        sa.Column('actual_end_time', sa.String(50), nullable=True),
        sa.Column('burst_duration_mins', sa.Integer(), server_default='0'),
        sa.Column('requesting_dept', sa.String(100), nullable=False, server_default='Engineering'),
        sa.Column('block_purpose', sa.String(200), nullable=True),
        sa.Column('traffic_impact_status', sa.String(200), nullable=True),
        sa.Column('hitl_status', sa.String(50), nullable=True),
        sa.Column('controller_remarks', sa.Text(), nullable=True),
        sa.Column('controller_id', sa.String(50), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('hitl_action_by', sa.String(100), nullable=True),
        sa.Column('hitl_action_at', sa.DateTime(), nullable=True),
        sa.Column('hitl_remarks', sa.Text(), nullable=True),
        sa.Column('digital_signature', sa.String(255), nullable=True),
        sa.Column('original_schedule', sa.JSON(), nullable=True),
        sa.Column('conflict_ids', sa.JSON(), nullable=True),
        sa.Column('bundled', sa.Boolean(), server_default=sa.text('false')),
    )
    op.create_index('ix_tasks_id', 'tasks', ['id'])
    op.create_index('ix_tasks_department', 'tasks', ['department'])
    op.create_index('ix_tasks_location', 'tasks', ['location'])
    op.create_index('ix_tasks_corridor', 'tasks', ['corridor'])
    op.create_index('ix_tasks_severity', 'tasks', ['severity'])
    op.create_index('ix_tasks_priority_score', 'tasks', ['priority_score'])
    op.create_index('ix_tasks_status', 'tasks', ['status'])
    op.create_index('ix_tasks_requested_date', 'tasks', ['requested_date'])

    # 5. conflicts
    op.create_table(
        'conflicts',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('corridor', sa.String(50), sa.ForeignKey('corridors.code', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.String(50), server_default='2026-09-08', nullable=False),
        sa.Column('location', sa.String(200), nullable=True),
        sa.Column('task_ids', sa.JSON(), nullable=False),
        sa.Column('departments', sa.JSON(), nullable=False),
        sa.Column('conflict_type', sa.String(100), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(50), server_default='Critical'),
        sa.Column('status', sa.String(50), server_default='Open'),
        sa.Column('resolution_method', sa.String(150), nullable=True),
        sa.Column('resolution', sa.Text(), nullable=True),
    )
    op.create_index('ix_conflicts_id', 'conflicts', ['id'])
    op.create_index('ix_conflicts_corridor', 'conflicts', ['corridor'])
    op.create_index('ix_conflicts_date', 'conflicts', ['date'])
    op.create_index('ix_conflicts_status', 'conflicts', ['status'])

    # 6. bundles
    op.create_table(
        'bundles',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('code', sa.String(100), unique=True, nullable=True),
        sa.Column('name', sa.String(200), nullable=True),
        sa.Column('corridor', sa.String(50), sa.ForeignKey('corridors.code', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.String(50), nullable=False),
        sa.Column('start_time', sa.String(20), nullable=True),
        sa.Column('end_time', sa.String(20), nullable=True),
        sa.Column('duration_hours', sa.Float(), server_default='0.0'),
        sa.Column('task_ids', sa.JSON(), nullable=False),
        sa.Column('departments', sa.JSON(), nullable=False),
        sa.Column('window_id', sa.String(50), sa.ForeignKey('corridor_windows.id', ondelete='SET NULL'), nullable=True),
        sa.Column('downtime_saved_hours', sa.Float(), server_default='0.0'),
        sa.Column('status', sa.String(50), server_default='Candidate'),
    )
    op.create_index('ix_bundles_id', 'bundles', ['id'])
    op.create_index('ix_bundles_code', 'bundles', ['code'])
    op.create_index('ix_bundles_corridor', 'bundles', ['corridor'])
    op.create_index('ix_bundles_date', 'bundles', ['date'])
    op.create_index('ix_bundles_status', 'bundles', ['status'])

    # 7. schedules
    op.create_table(
        'schedules',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('block_id', sa.String(100), unique=True, nullable=False),
        sa.Column('block_code', sa.String(100), nullable=False),
        sa.Column('corridor', sa.String(50), sa.ForeignKey('corridors.code', ondelete='RESTRICT'), nullable=False),
        sa.Column('corridor_name', sa.String(150), nullable=False),
        sa.Column('date', sa.String(50), nullable=False),
        sa.Column('start_time', sa.String(20), nullable=False),
        sa.Column('end_time', sa.String(20), nullable=False),
        sa.Column('duration_hours', sa.Float(), nullable=False),
        sa.Column('status', sa.String(50), server_default='Approved'),
        sa.Column('departments', sa.JSON(), nullable=False),
        sa.Column('task_ids', sa.JSON(), nullable=False),
        sa.Column('tasks_count', sa.Integer(), server_default='1'),
        sa.Column('priority', sa.String(50), server_default='Medium'),
        sa.Column('bundle_id', sa.String(50), sa.ForeignKey('bundles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('traffic_block_granted', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('power_block_granted', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('controller_approval', sa.String(150), server_default='Granted (Chief Controller/DLI)'),
        sa.Column('speed_restriction_kmph', sa.Integer(), nullable=True),
        sa.Column('efficiency_gain_percent', sa.Float(), server_default='0.0'),
        sa.Column('ptw_status', sa.String(50), server_default='Issued'),
        sa.Column('safety_validated', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('caution_order_generated', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_schedules_id', 'schedules', ['id'])
    op.create_index('ix_schedules_block_id', 'schedules', ['block_id'])
    op.create_index('ix_schedules_block_code', 'schedules', ['block_code'])
    op.create_index('ix_schedules_corridor', 'schedules', ['corridor'])
    op.create_index('ix_schedules_date', 'schedules', ['date'])
    op.create_index('ix_schedules_status', 'schedules', ['status'])

    # 8. optimization_runs
    op.create_table(
        'optimization_runs',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('engine', sa.String(150), nullable=False),
        sa.Column('execution_time_ms', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.String(50), nullable=False),
        sa.Column('summary', sa.JSON(), nullable=False),
        sa.Column('scheduled_blocks', sa.JSON(), nullable=False),
        sa.Column('bundles', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(50), server_default='SUCCESS'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_optimization_runs_id', 'optimization_runs', ['id'])

    # 9. sync_sources
    op.create_table(
        'sync_sources',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('name', sa.String(150), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(50), server_default='Healthy'),
        sa.Column('last_sync_time', sa.String(50), nullable=False),
        sa.Column('records_received', sa.Integer(), server_default='0'),
        sa.Column('records_success', sa.Integer(), server_default='0'),
        sa.Column('records_failed', sa.Integer(), server_default='0'),
        sa.Column('frequency', sa.String(50), server_default='Every 15 minutes'),
    )

    # 10. sync_history
    op.create_table(
        'sync_history',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('source', sa.String(50), sa.ForeignKey('sync_sources.id', ondelete='CASCADE'), nullable=False),
        sa.Column('started', sa.String(50), nullable=False),
        sa.Column('completed', sa.String(50), nullable=True),
        sa.Column('records', sa.Integer(), server_default='0'),
        sa.Column('success', sa.Integer(), server_default='0'),
        sa.Column('failed', sa.Integer(), server_default='0'),
        sa.Column('status', sa.String(50), server_default='Success'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_sync_history_id', 'sync_history', ['id'])
    op.create_index('ix_sync_history_source', 'sync_history', ['source'])

    # 11. notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.String(50), nullable=False),
        sa.Column('read', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('related_id', sa.String(50), nullable=True),
        sa.Column('recipient_user_id', sa.String(50), nullable=True),
        sa.Column('recipient_department', sa.String(100), nullable=True),
        sa.Column('recipient_role', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_notifications_id', 'notifications', ['id'])
    op.create_index('ix_notifications_read', 'notifications', ['read'])

    # 12. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.String(50), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', sa.String(100), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'])

    # 13. data_quality_samples
    op.create_table(
        'data_quality_samples',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('source', sa.String(50), nullable=False),
        sa.Column('raw_text', sa.Text(), nullable=False),
        sa.Column('parsing_status', sa.String(50), server_default='Parsed'),
        sa.Column('parsed', sa.JSON(), nullable=False),
    )

    # 14. knowledge_chunks
    op.create_table(
        'knowledge_chunks',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('manual_name', sa.String(100), nullable=False),
        sa.Column('chapter', sa.String(100), nullable=True),
        sa.Column('rule_number', sa.String(50), nullable=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_knowledge_chunks_id', 'knowledge_chunks', ['id'])
    op.create_index('ix_knowledge_chunks_manual', 'knowledge_chunks', ['manual_name'])

    # 15. coa_stream_logs
    op.create_table(
        'coa_stream_logs',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('stream_id', sa.String(100), index=True, nullable=False),
        sa.Column('division_id', sa.String(50), server_default='DLI'),
        sa.Column('section_name', sa.String(150), server_default='NDLS-GZB'),
        sa.Column('source_system', sa.String(50), server_default='COA'),
        sa.Column('raw_payload', sa.JSON(), nullable=False),
        sa.Column('parsed_task_id', sa.String(50), sa.ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(50), server_default='Ingested'),
        sa.Column('received_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_coa_stream_logs_id', 'coa_stream_logs', ['id'])

    # 16. hitl_reviews
    op.create_table(
        'hitl_reviews',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('task_id', sa.String(50), sa.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=True),
        sa.Column('bundle_id', sa.String(50), nullable=True),
        sa.Column('schedule_id', sa.String(50), nullable=True),
        sa.Column('controller_id', sa.String(50), nullable=False),
        sa.Column('controller_name', sa.String(150), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('original_params', sa.JSON(), nullable=True),
        sa.Column('modified_params', sa.JSON(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('digital_signature', sa.String(255), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_hitl_reviews_id', 'hitl_reviews', ['id'])


def downgrade() -> None:
    op.drop_table('hitl_reviews')
    op.drop_table('coa_stream_logs')
    op.drop_table('knowledge_chunks')
    op.drop_table('data_quality_samples')
    op.drop_table('audit_logs')
    op.drop_table('notifications')
    op.drop_table('sync_history')
    op.drop_table('sync_sources')
    op.drop_table('optimization_runs')
    op.drop_table('schedules')
    op.drop_table('bundles')
    op.drop_table('conflicts')
    op.drop_table('tasks')
    op.drop_table('corridor_windows')
    op.drop_table('corridors')
    op.drop_table('users')