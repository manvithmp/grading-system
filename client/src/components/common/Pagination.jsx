export default function Pagination({page,totalPages,onPage}){
  return (
    <div className="pagination">
      <button className="page-btn" disabled={page===1} onClick={()=>onPage(page-1)}>Prev</button>
      <span style={{color:'var(--muted)'}}>Page {page} of {totalPages}</span>
      <button className="page-btn" disabled={page===totalPages} onClick={()=>onPage(page+1)}>Next</button>
    </div>
  );
}
