import {useState} from 'react';
import {api} from '../../services/api.js';
import {toast} from 'react-toastify';

export default function StudentEditModal({student,onClose}){
  const [form,setForm]=useState({...student});

  const save=async()=>{
    try{
      await api.put(`/students/${student._id}`,form);
      toast.success('Updated');
      onClose();
    }catch(err){
      toast.error('Update failed');
    }
  };

  return(
    <div className="modal">
      <div className="modal-box">
        <h3>Edit Student</h3>
        <input value={form.student_name} onChange={e=>setForm({...form,student_name:e.target.value})}/>
        <input type="number" value={form.marks_obtained} onChange={e=>setForm({...form,marks_obtained:e.target.value})}/>
        <button onClick={save}>Save</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
