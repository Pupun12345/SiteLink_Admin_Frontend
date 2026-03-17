import React from "react";
import { useNavigate } from "react-router-dom";
import "./Requirements.css";
import Sidebar from "../components/Sidebar";

const data = [
  {
    id: "#REQ-8291",
    vendor: "Apex Solutions Ltd",
    role: "Site Safety Manager",
    type: "Full-time Contract",
    qty: "04",
    location: "Austin, TX",
    apps: "24",
    status: "Open",
    date: "Oct 12, 2023",
  },
  {
    id: "#REQ-8285",
    vendor: "Global Infra Corp",
    role: "Civil Engineer",
    type: "On-site",
    qty: "02",
    location: "Denver, CO",
    apps: "08",
    status: "Filled",
    date: "Oct 10, 2023",
  },
  {
    id: "#REQ-8277",
    vendor: "TechLink Systems",
    role: "Senior Technician",
    type: "Offshore",
    qty: "12",
    location: "Houston, TX",
    apps: "142",
    status: "Closed",
    date: "Sep 28, 2023",
  },
  {
    id: "#REQ-8270",
    vendor: "Urban Builders",
    role: "Crane Operator",
    type: "Heavy Machinery",
    qty: "01",
    location: "Phoenix, AZ",
    apps: "03",
    status: "Cancelled",
    date: "Sep 22, 2023",
  },
  {
    id: "#REQ-8264",
    vendor: "Skyline Structures",
    role: "Structural Inspector",
    type: "Contractual",
    qty: "02",
    location: "Seattle, WA",
    apps: "19",
    status: "Open",
    date: "Sep 15, 2023",
  },
];

export default function RequirementsDashboard() {
  const navigate = useNavigate();
  return (
    <div className="requirements-page">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="requirements-main">
        {/* Header */}
        <header className="requirements-header">
          <input
            className="search"
            placeholder="Search Requirement ID, Vendors or Roles..."
          />

          <div className="profile">
            <img
              src="https://i.pravatar.cc/100"
              alt="profile"
            />
            <div>
              <p>Alex Rivera</p>
              <span>Super Admin</span>
            </div>
          </div>
        </header>

        {/* Title */}
        <div className="page-header">
          <div>
            <h1>Job Requirements</h1>
            <p>Review and manage active requisitions for field operations.</p>
          </div>

          <button className="export">Export CSV</button>
        </div>

        {/* Filters */}
        <div className="filters">
          <select>
            <option>Worker Role: All</option>
            <option>Site Manager</option>
            <option>Safety Engineer</option>
            <option>Civil Technician</option>
          </select>

          <select>
            <option>Location: Global</option>
            <option>New York</option>
            <option>London</option>
            <option>Singapore</option>
          </select>

          <select>
            <option>Status: Any</option>
            <option>Open</option>
            <option>Filled</option>
            <option>Closed</option>
          </select>

          <button className="clear">Clear Filters</button>
        </div>

        {/* Table */}
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Req ID</th>
                <th>Vendor</th>
                <th>Worker Role</th>
                <th>Qty</th>
                <th>Location</th>
                <th>Apps</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td className="req">{item.id}</td>
                  <td>{item.vendor}</td>
                  <td>
                    <strong 
                      style={{ cursor: 'pointer', color: '#007bff' }}
                      onClick={() => navigate(`/admin/requirements/${item.id.replace('#', '')}`)}
                    >
                      {item.role}
                    </strong>
                    <div className="role-type">{item.type}</div>
                  </td>
                  <td>{item.qty}</td>
                  <td>{item.location}</td>
                  <td>{item.apps}</td>
                  <td>
                    <span className={`status ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <span>Page 1 of 12</span>

            <div>
              <button>{"<"}</button>
              <button>{">"}</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
