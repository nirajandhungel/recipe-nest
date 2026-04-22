import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Loader from '../../components/ui/Loader';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { formatDate, getInitials } from '../../utils/helpers';
import { Search, ShieldOff, ShieldCheck, Trash2, Users, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const roleColor = (role) => ({ admin: 'bg-purple-100 text-purple-700', chef: 'bg-brand-100 text-brand-700', user: 'bg-blue-100 text-blue-700' }[role] || '');
const statusColor = (s) => ({ active: 'bg-emerald-100 text-emerald-700', suspended: 'bg-red-100 text-red-700', inactive: 'bg-surface-100 text-surface-600' }[s] || '');

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers({ q: query, page, limit: 15 });
      setUsers(data.data?.users || data.users || []);
      setTotalPages(data.data?.totalPages || 1);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [query, page]);

  const setLoading2 = (id, val) => setActionLoading((prev) => ({ ...prev, [id]: val }));

  const handleSuspend = async (id) => {
    setLoading2(id, true);
    try {
      await adminApi.suspendUser(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, status: 'suspended' } : u));
      toast.success('User suspended');
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setLoading2(id, false); }
  };

  const handleActivate = async (id) => {
    setLoading2(id, true);
    try {
      await adminApi.activateUser(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, status: 'active' } : u));
      toast.success('User activated');
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setLoading2(id, false); }
  };

  const handleDelete = async () => {
    setLoading2(deleteTarget._id, true);
    try {
      await adminApi.deleteUser(deleteTarget._id);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success('User deleted');
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setLoading2(deleteTarget?._id, false); }
  };

  const handleToggleFeatured = async (id, currentVal) => {
    setLoading2(id, true);
    try {
      await adminApi.toggleFeatured(id, !currentVal);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isFeatured: !currentVal } : u));
      toast.success(!currentVal ? 'Chef featured' : 'Chef unfeatured');
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setLoading2(id, false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-500" />
          <h1 className="font-display text-2xl font-bold">User Management</h1>
        </div>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input type="text" placeholder="Search users…" value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          className="input-base pl-9" />
      </div>

      {loading ? <Loader /> : (
        <>
          <div className="card overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 dark:border-surface-800 text-left">
                  <th className="px-4 py-3 font-semibold text-surface-600">User</th>
                  <th className="px-4 py-3 font-semibold text-surface-600 hidden sm:table-cell">Role</th>
                  <th className="px-4 py-3 font-semibold text-surface-600 hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 font-semibold text-surface-600 hidden lg:table-cell">Joined</th>
                  <th className="px-4 py-3 font-semibold text-surface-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-surface-50 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-200 text-surface-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-surface-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`badge text-xs ${roleColor(user.role)}`}>{user.role}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`badge text-xs ${statusColor(user.status)}`}>{user.status}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-surface-500 text-xs">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {user.role === 'chef' && (
                          <button onClick={() => handleToggleFeatured(user._id, user.isFeatured)} disabled={actionLoading[user._id]}
                            className={`p-1.5 rounded-lg transition-colors ${user.isFeatured ? 'text-yellow-500 hover:bg-yellow-100' : 'text-surface-300 hover:bg-surface-100'}`}
                            title={user.isFeatured ? 'Unfeature Chef' : 'Feature Chef'}>
                            <Star className={`w-4 h-4 ${user.isFeatured ? 'fill-current' : ''}`} />
                          </button>
                        )}
                        {user.status === 'suspended' ? (
                          <button onClick={() => handleActivate(user._id)} disabled={actionLoading[user._id]}
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors" title="Activate">
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleSuspend(user._id)} disabled={actionLoading[user._id]}
                            className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 transition-colors" title="Suspend">
                            <ShieldOff className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(user)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User" size="sm">
        <p className="text-surface-600 mb-5">
          Delete <span className="font-semibold">{deleteTarget?.firstName} {deleteTarget?.lastName}</span>? This is permanent.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={actionLoading[deleteTarget?._id]} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;
