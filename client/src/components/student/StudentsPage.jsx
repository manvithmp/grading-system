import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Pagination from '../common/Pagination.jsx';
import StudentEditModal from './StudentEditModal.jsx';
import { toast } from 'react-toastify';

export default function StudentsPage() {
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);

  const normalize = (payload) => {
    if (payload && Array.isArray(payload.students)) {
      return { students: payload.students, totalPages: payload.totalPages ?? 1 };
    }
    if (Array.isArray(payload)) {
      return { students: payload, totalPages: 1 };
    }
    return { students: [], totalPages: 1 };
  };

  const fetchData = async (pageNum = page, query = q) => {
    try {
      setLoading(true);
      const { data } = await api.get('/students', { params: { page: pageNum, q: query } });
      const { students, totalPages } = normalize(data);
      setList(students);
      setTotal(totalPages || 1);

      const allFields = new Set();
      students.forEach(s => Object.keys(s).forEach(k => allFields.add(k)));
      const blacklist = new Set(['__v', 'createdAt', 'updatedAt']);
      setColumns([...allFields].filter(f => !blacklist.has(f)));
    } catch (err) {
      setList([]);
      setTotal(1);
      toast.error(err?.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page, q);
  }, [page, q]);

  const remove = async (id) => {
    try {
      await api.delete(`/students/${id}`);
      toast.success('Deleted');
      fetchData(page, q);
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const safeList = Array.isArray(list) ? list : [];

  return (
    <>
      <div className="toolbar">
        <input
          className="input"
          placeholder="Search by any field…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button className="btn ghost" onClick={() => setPage(1)}>Search</button>
          <button className="btn ghost" onClick={() => { setQ(''); setPage(1); }}>Clear</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map(col => <th key={col}>{col}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length + 1} style={{ padding: '1rem', color: 'var(--muted)' }}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && safeList.map(s => (
              <tr key={s._id || columns.map(col => s[col]).join('|')}>
                {columns.map(col => <td key={col}>{s[col]}</td>)}
                <td>
                  
                  {s._id && (
                    <>
                      <button className="btn ghost" onClick={() => setEditing(s)}>Edit</button>
                      <button className="btn ghost" onClick={() => remove(s._id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!loading && safeList.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} style={{ padding: '1rem', color: 'var(--muted)' }}>
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          className="page-btn"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>
        <span style={{ color: 'var(--muted)' }}>
          Page {page} of {total}
        </span>
        <button
          className="page-btn"
          disabled={page >= total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

      {editing && (
        <StudentEditModal
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchData(page, q); }}
        />
      )}
    </>
  );
}