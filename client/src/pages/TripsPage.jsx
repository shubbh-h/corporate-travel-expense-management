import { useState } from 'react';
import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';
import PageToolbar from '../components/PageToolbar';
import Modal from '../components/Modal';

const trips = [
  { id: 'TW-1024', title: 'Client strategy meeting', destination: 'Bengaluru, India', dates: 'Sep 08 – Sep 11, 2026', mode: 'Flight', status: 'Upcoming', tone: 'info' },
  { id: 'TW-1018', title: 'Quarterly business review', destination: 'Mumbai, India', dates: 'Oct 14 – Oct 16, 2026', mode: 'Flight', status: 'Planning', tone: 'warning' },
];

export default function TripsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = trips.filter((t) => `${t.title} ${t.destination} ${t.id}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="module-page">
      <div className="page-heading">
        <div><span className="section-eyebrow">TRAVEL</span><h1>My trips</h1><p>Plan, organize and keep track of your business travel.</p></div>
        <button className="btn btn-primary btn-inline" onClick={() => setOpen(true)}><Icon name="plus" size={16} /> New trip</button>
      </div>
      <div className="module-tabs"><button className="active">All trips <span>2</span></button><button>Upcoming</button><button>Completed</button></div>
      <PageToolbar search={search} onSearch={setSearch} placeholder="Search trips..." />
      <section className="panel table-panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Trip</th><th>Destination</th><th>Dates</th><th>Travel</th><th>Status</th><th /></tr></thead>
            <tbody>
              {filtered.map((trip) => (
                <tr key={trip.id}>
                  <td><div className="table-primary"><span className="row-icon blue"><Icon name="plane" size={15} /></span><div><strong>{trip.title}</strong><small>{trip.id}</small></div></div></td>
                  <td>{trip.destination}</td><td>{trip.dates}</td><td>{trip.mode}</td>
                  <td><StatusBadge tone={trip.tone}>{trip.status}</StatusBadge></td>
                  <td><button className="icon-button table-more"><Icon name="more" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>Showing {filtered.length} of {trips.length} trips</span><span>Trip booking integrations can be connected here.</span></div>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Plan a new trip" subtitle="Create the trip details first. Booking integrations can be connected later.">
        <form onSubmit={(e) => { e.preventDefault(); setOpen(false); }}>
          <div className="form-two">
            <div className="form-group"><label className="form-label">Trip name</label><input className="form-input" placeholder="e.g. Client meeting" /></div>
            <div className="form-group"><label className="form-label">Destination</label><input className="form-input" placeholder="City, country" /></div>
            <div className="form-group"><label className="form-label">Start date</label><input className="form-input" type="date" /></div>
            <div className="form-group"><label className="form-label">End date</label><input className="form-input" type="date" /></div>
          </div>
          <div className="form-group"><label className="form-label">Purpose</label><textarea className="form-input form-textarea" placeholder="What is the purpose of this trip?" /></div>
          <div className="modal-actions"><button type="button" className="btn btn-secondary btn-inline" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary btn-inline">Save trip</button></div>
        </form>
      </Modal>
    </div>
  );
}
