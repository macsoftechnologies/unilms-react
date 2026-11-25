import React from 'react';
import { Link } from 'react-router-dom';

const SupervisorInvalidToken = () => {
  return (
    <>

<div className="html-wrapper" lang="en">
<div className="body-wrapper">
<div className="card border-0 shadow-sm rounded-4 p-5 text-center" style={{"maxWidth":"500px"}}>
    <i className="fas fa-exclamation-triangle fa-4x text-warning mb-3"></i>
    <h4 className="fw-bold text-dark mb-2">Access Link Expired or Invalid</h4>
    <p className="text-muted mb-4">This magic access link for the Industry Supervisor Portal is invalid, revoked, or has passed its 120-day validity period.</p>
    <p className="small text-muted">Please contact the university Training & Placement Office (TPO) to request a new access link.</p>
</div>
</div>
</div>

</>
  );
};

export default SupervisorInvalidToken;