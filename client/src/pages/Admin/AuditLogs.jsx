import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Loader from '../../components/ui/Loader';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { timeAgo, formatDate } from '../../utils/helpers';
import { ScrollText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const actionColor = (action = '') => {
  if (action.includes('delete') || action.includes('suspend')) return 'bg-red-100 text-red-700';
  if (action.includes('create') || action.includes('approve')) return 'bg-emerald-100 text-emerald-700';
  if (action.includes('update') || action.includes('edit')) return 'bg-blue-100 text-blue-700';
  return 'bg-surface-100 text-surface-600';
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi.getAuditLogs({ page, limit: 20 })
      .then(({ data }) => {
        setLogs(data.data?.logs || data.logs || []);
        setTotalPages(data.data?.totalPages || 1);
      })
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoading(false));
  }, [page]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await adminApi.exportAuditLogs();
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Logs exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-brand-500" />
          <h1 className="font-display text-2xl font-bold">Audit Logs</h1>
        </div>
        <Button variant="secondary" loading={exporting} onClick={handleExport}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {loading ? <Loader /> : logs.length === 0 ? (
        <p className="text-center text-surface-400 py-10">No audit logs found.</p>
      ) : (
        <>
          <div className="card overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 dark:border-surface-800 text-left">
                  <th className="px-4 py-3 font-semibold text-surface-600">Action</th>
                  <th className="px-4 py-3 font-semibold text-surface-600 hidden sm:table-cell">User</th>
                  <th className="px-4 py-3 font-semibold text-surface-600 hidden md:table-cell">Target</th>
                  <th className="px-4 py-3 font-semibold text-surface-600 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-surface-50 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${actionColor(log.action)}`}>{log.action}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-surface-600">
                      {log.userId?.email || log.userId?.username || '–'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-surface-500 text-xs">
                      {log.targetType && <span className="badge bg-surface-100 text-surface-600 mr-1">{log.targetType}</span>}
                      {log.targetId?.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-right text-surface-400 text-xs whitespace-nowrap">
                      {timeAgo(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default AuditLogs;
