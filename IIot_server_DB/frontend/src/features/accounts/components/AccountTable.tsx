import React from 'react';
import { Edit3, RotateCcw, Shield, Trash2, Users } from 'lucide-react';
import type { User } from '../../../types';
import { formatThaiDateTime } from '../../../services/utils';
import { canModifyAccount, ROLE_BADGE_MAP } from '../accountHelpers';

interface AccountTableProps {
  users: User[];
  isLoading: boolean;
  viewDeleted: boolean;
  currentRole: string;
  selectedIds: Set<number>;
  allOnPageSelected: boolean;
  onToggleSelectAll: () => void;
  onToggleSelectOne: (id: number) => void;
  onEdit: (user: User) => void;
  onToggleDelete: (user: User) => void;
}

/**
 * Renders the account list table with role badges, timestamps, and permission-aware actions.
 */
export const AccountTable: React.FC<AccountTableProps> = ({
  users,
  isLoading,
  viewDeleted,
  currentRole,
  selectedIds,
  allOnPageSelected,
  onToggleSelectAll,
  onToggleSelectOne,
  onEdit,
  onToggleDelete,
}) => (
  <div className="table-responsive">
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ width: '42px', textAlign: 'center' }}>
            <input
              type="checkbox"
              checked={allOnPageSelected}
              onChange={onToggleSelectAll}
              aria-label="เลือกทั้งหมดในหน้านี้"
            />
          </th>
          <th>ID</th>
          <th>รหัสประจำตัว (University ID)</th>
          <th>ชื่อ - นามสกุล</th>
          <th>สิทธิ์ (Role)</th>
          <th>เข้าสู่ระบบล่าสุด</th>
          <th style={{ textAlign: 'right' }}>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <tr>
            <td colSpan={7} className="table-empty-row">
              <Users size={34} className="text-muted" style={{ marginBottom: '8px' }} />
              <div>
                {isLoading
                  ? 'กำลังโหลดข้อมูลบัญชีผู้ใช้...'
                  : viewDeleted
                    ? 'ไม่พบบัญชีที่ถูกลบในถังขยะ'
                    : 'ไม่พบข้อมูลบัญชีผู้ใช้'}
              </div>
            </td>
          </tr>
        ) : (
          users.map((u) => {
            const allowed = canModifyAccount(currentRole, u.role);
            const checked = selectedIds.has(u.user_id);
            const badgeCfg = ROLE_BADGE_MAP[u.role] || {
              className: 'badge badge-gray',
              label: u.role,
            };

            return (
              <tr key={u.user_id} style={{ background: checked ? '#fff5f9' : undefined }}>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!allowed}
                    onChange={() => onToggleSelectOne(u.user_id)}
                    aria-label={`เลือกบัญชี ${u.university_id}`}
                  />
                </td>
                <td>
                  <span className="badge badge-gray">#{u.user_id}</span>
                </td>
                <td className="mono">
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{u.university_id}</span>
                </td>
                <td style={{ fontWeight: 600 }}>
                  {u.first_name} {u.last_name}
                </td>
                <td>
                  <span className={badgeCfg.className}>{badgeCfg.label}</span>
                </td>
                <td className="text-muted" style={{ fontSize: '12.5px' }}>
                  {formatThaiDateTime(u.last_login_at, true)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {!allowed ? (
                    <span
                      className="badge badge-gray"
                      style={{ gap: '4px' }}
                      title="สิทธิ์ Admin ไม่สามารถแก้ไขบัญชีระดับ Dev หรือ Teacher ได้"
                    >
                      <Shield size={12} />
                      <span>ไม่มีสิทธิ์แก้ไข</span>
                    </span>
                  ) : (
                    <div className="action-btn-group">
                      {!viewDeleted && (
                        <button
                          type="button"
                          className="action-edit-btn"
                          onClick={() => onEdit(u)}
                          title="แก้ไขสิทธิ์หรือรหัสผ่าน"
                        >
                          <Edit3 size={13} />
                          <span>แก้ไข</span>
                        </button>
                      )}
                      {viewDeleted ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => onToggleDelete(u)}
                          title="กู้คืนบัญชี"
                        >
                          <RotateCcw size={13} />
                          <span>กู้คืน</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="action-delete-btn"
                          onClick={() => onToggleDelete(u)}
                          title="ลบบัญชี (Soft Delete)"
                        >
                          <Trash2 size={13} />
                          <span>ลบ</span>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);
