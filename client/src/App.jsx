import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import UploadPage from './components/upload/UploadPage.jsx';
import StudentsPage from './components/student/StudentsPage.jsx';
import DarkModeToggle from './components/common/DarkModeToggle.jsx';
import 'react-toastify/dist/ReactToastify.css';

export default function App(){
  return (
    <BrowserRouter>
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <div className="logo">GM</div>
            <span>Grade Manager</span>
          </div>

          <nav className="nav">
            <NavLink to="/" end className={({isActive})=>isActive?'active':''}>Upload</NavLink>
            <NavLink to="/students" className={({isActive})=>isActive?'active':''}>Students</NavLink>
          </nav>

          <DarkModeToggle />
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<UploadPage/>}/>
          <Route path="/students" element={<StudentsPage/>}/>
        </Routes>
      </main>

      <ToastContainer position="top-right" autoClose={3000}/>
    </BrowserRouter>
  );
}
