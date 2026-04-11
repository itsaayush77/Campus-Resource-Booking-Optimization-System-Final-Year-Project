import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getAllUsers,
  suspendUser,
  toggleUserActive,
  unsuspendUser,
  updateUserRole,
} from '../api/adminApi';
import { LuRefreshCw } from 'react-icons/lu';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendDays, setSuspendDays] = useState('3');
  const [suspendReason, setSuspendReason] = useState('Repeated no-shows');

  const fetchUsers = async ({ showLoader = false } = {}) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    const data = await getAllUsers();
    if (data.success && Array.isArray(data.users)) {
      setUsers(data.users);
    } else {
      toast.error(data.message || 'Failed to load users');
      setUsers([]);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUsers({ showLoader: true });
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;

      if (statusFilter === 'active' && !user.isActive) return false;
      if (statusFilter === 'inactive' && user.isActive) return false;
      if (statusFilter === 'suspended' && !user.isSuspended) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${user.name || ''} ${user.email || ''} ${user.department || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, search]);

  const handleToggleActive = async (userId) => {
    setBusyId(userId);
    const data = await toggleUserActive(userId);
    setBusyId(null);

    if (data.success) {
      toast.success(data.message || 'User status updated');
      fetchUsers();
    } else {
      toast.error(data.message || 'Could not update user status');
    }
  };

  const handleRoleChange = async (userId, role) => {
    setBusyId(userId);
    const data = await updateUserRole(userId, role);
    setBusyId(null);

    if (data.success) {
      toast.success(data.message || 'User role updated');
      fetchUsers();
    } else {
      toast.error(data.message || 'Could not update role');
    }
  };

  const handleUnsuspend = async (userId) => {
    setBusyId(userId);
    const data = await unsuspendUser(userId);
    setBusyId(null);

    if (data.success) {
      toast.success(data.message || 'User unsuspended');
      fetchUsers();
    } else {
      toast.error(data.message || 'Could not unsuspend user');
    }
  };

  const submitSuspend = async () => {
    if (!suspendTarget) return;

    const days = Number(suspendDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      toast.error('Suspension days must be between 1 and 365');
      return;
    }

    setBusyId(suspendTarget.id);
    const data = await suspendUser(suspendTarget.id, days, suspendReason.trim() || undefined);
    setBusyId(null);

    if (data.success) {
      toast.success(data.message || 'User suspended');
      setSuspendTarget(null);
      setSuspendDays('3');
      setSuspendReason('Repeated no-shows');
      fetchUsers();
    } else {
      toast.error(data.message || 'Could not suspend user');
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] uppercase text-blue-600">Admin Workspace</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900">User Management</h1>
            <p className="mt-2 text-gray-600">Filter users, toggle account access, suspend/unsuspend, and switch student/staff roles.</p>
          </div>

          <button
            type="button"
            onClick={() => fetchUsers()}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-semibold text-white transition-all duration-200 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-70"
          >
            <LuRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 mb-6 bg-white border border-gray-200 rounded-2xl md:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name/email/department"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="all">All roles</option>
            <option value="student">Student</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <div className="flex items-center text-sm text-gray-500">
            Showing <span className="mx-1 font-semibold text-gray-800">{filteredUsers.length}</span> users
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl">
            <p className="text-gray-600">No users match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-gray-700">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">No-shows</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isBusy = busyId === user.id;
                    const isAdmin = user.role === 'admin';

                    return (
                      <tr key={user.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          {user.department && <p className="text-xs text-gray-500">{user.department}</p>}
                        </td>
                        <td className="px-4 py-3 capitalize">{user.role}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {user.isSuspended && (
                              <span className="inline-flex px-2 py-1 ml-2 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full">
                                Suspended
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold">{user.noShowCount || 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {!isAdmin && (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleToggleActive(user.id)}
                                  className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-60"
                                >
                                  {user.isActive ? 'Deactivate' : 'Activate'}
                                </button>

                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => setSuspendTarget(user)}
                                  className="px-3 py-1 text-xs font-semibold text-orange-700 bg-orange-100 rounded hover:bg-orange-200 disabled:opacity-60"
                                >
                                  Suspend
                                </button>

                                {user.isSuspended && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleUnsuspend(user.id)}
                                    className="px-3 py-1 text-xs font-semibold text-emerald-700 rounded bg-emerald-100 hover:bg-emerald-200 disabled:opacity-60"
                                  >
                                    Unsuspend
                                  </button>
                                )}

                                {user.role === 'student' ? (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleRoleChange(user.id, 'staff')}
                                    className="px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded hover:bg-purple-200 disabled:opacity-60"
                                  >
                                    Promote to staff
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleRoleChange(user.id, 'student')}
                                    className="px-3 py-1 text-xs font-semibold text-indigo-700 rounded bg-indigo-100 hover:bg-indigo-200 disabled:opacity-60"
                                  >
                                    Demote to student
                                  </button>
                                )}
                              </>
                            )}

                            {isAdmin && <span className="text-xs text-gray-400">Admin accounts are managed manually.</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md p-6 bg-white shadow-xl rounded-2xl">
            <h3 className="text-lg font-bold text-gray-900">Suspend user</h3>
            <p className="mt-1 text-sm text-gray-600">{suspendTarget.name} ({suspendTarget.email})</p>

            <label className="block mt-4 text-sm font-medium text-gray-700">Days</label>
            <input
              type="number"
              min={1}
              max={365}
              value={suspendDays}
              onChange={(e) => setSuspendDays(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
            />

            <label className="block mt-3 text-sm font-medium text-gray-700">Reason</label>
            <textarea
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitSuspend}
                className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700"
              >
                Confirm suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
