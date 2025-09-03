import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Pagination from '../common/Pagination.jsx';
import StudentEditModal from './StudentEditModal.jsx';
import { toast } from 'react-toastify';

export default function StudentsPage(){
  // always start with arrays, never undefined
  const [list, setList]       = useState([]);        // safe for .map
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(1);
  const [q, setQ]             = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  // normalize any backend shape into { students:[], totalPages:1 }
  const normalize = (payload)=>{
    // if backend returns {students:[], totalPages: N}
    if (payload && Array.isArray(payload.students)) {
      return { students: payload.students, totalPages: payload.totalPages ?? 1 };
    }
    // if backend directly returns an array (fallback)
    if (Array.isArray(payload)) {
      return { students: payload, totalPages: 1 };
    }
    // any other shape → empty list
    return { students: [], totalPages: 1 };
  };

  const fetchData = async (p = page, query = q) => {
    try{
      setLoading(true);
      const { data } = await api.get('/students', { params:{ page: p, q: query } });
      const { students, totalPages } = normalize(data);
      setList(students);           // will always be an array
      setTotal(totalPages || 1);
    }catch(err){
      // never set undefined into list
      setList([]);
      setTotal(1);
      toast.error(err?.response?.data?.message || 'Failed to load students');
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{ fetchData(1, q); },[]);

  const remove = async (id)=>{
    try{
      await api.delete(`/students/${id}`);
      toast.success('Deleted');
      fetchData(page, q);
    }catch(e){
      toast.error('Delete failed');
    }
  };

  const safeList = Array.isArray(list) ? list : []; // extra guard

  return (
    <>
      <div className="toolbar">
        <input className="input" placeholder="Search by ID or Name…" value={q}
               onChange={e=> setQ(e.target.value)} />
        <div style={{display:'flex',gap:'.6rem'}}>
          <button className="btn ghost" onClick={()=>fetchData(1,q)}>Search</button>
          <button className="btn ghost" onClick={()=>{ setQ(''); fetchData(1,''); }}>Clear</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student ID</th><th>Name</th><th>Total</th><th>Obtained</th><th>%</th><th>Grade</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="7" style={{padding:'1rem',color:'var(--muted)'}}>Loading…</td></tr>
            )}
            {!loading && safeList.map(s=>(
              <tr key={s._id || s.student_id}>
                <td>{s.student_id}</td>
                <td>{s.student_name}</td>
                <td>{s.total_marks}</td>
                <td>{s.marks_obtained}</td>
                <td>{s.percentage}</td>
                <td>{s.grade}</td>
                <td>
                  <button className="btn ghost" onClick={()=>setEditing(s)}>Edit</button>
                  <button className="btn ghost" onClick={()=>remove(s._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!loading && safeList.length===0 && (
              <tr><td colSpan="7" style={{padding:'1rem',color:'var(--muted)'}}>No students found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="page-btn" disabled={page<=1} onClick={()=>{ const p=page-1; setPage(p); fetchData(p,q);} }>Prev</button>
        <span style={{color:'var(--muted)'}}>Page {page} of {total}</span>
        <button className="page-btn" disabled={page>=total} onClick={()=>{ const p=page+1; setPage(p); fetchData(p,q);} }>Next</button>
      </div>

      {editing && <StudentEditModal student={editing} onClose={()=>setEditing(null)} onSaved={()=>{ setEditing(null); fetchData(page,q); }}/>}
    </>
  );
}
