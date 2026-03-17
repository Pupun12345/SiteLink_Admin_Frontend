import { useState } from "react";
import { useParams } from "react-router-dom";
import "./JobRequirements.css";
import Sidebar from "../components/Sidebar"

const jobsData = [
  {
    id: "REQ-8291",
    vendor: "Apex Solutions Ltd",
    role: "Site Safety Manager",
    type: "Full-time Contract",
    qty: "04",
    location: "Austin, TX",
    apps: "24",
    status: "Open",
    date: "Oct 12, 2023",
    description: "Detailed oversight of construction site safety, ensuring compliance with all local and federal regulations. Responsible for hazard identification and mitigation strategy. You will lead the safety protocols for our new high-rise residential project in central Austin, coordinating with both site engineers and regional OSHA inspectors.",
    skills: ["OSHA 30", "First Aid", "Risk Assessment"],
    experience: "5+ Years in High-Rise Construction",
    equipment: [
      "Standard PPE (Hard hat, high-vis vest, steel-toe boots)",
      "Digital Log Tablet (provided or bring-your-own)"
    ],
    projectSite: "Austin South Congress Project",
    address: "1200 S Congress Ave, Austin, TX 78704",
    mapImage: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "REQ-8285",
    vendor: "Global Infra Corp",
    role: "Civil Engineer",
    type: "On-site",
    qty: "02",
    location: "Denver, CO",
    apps: "08",
    status: "Filled",
    date: "Oct 10, 2023",
    description: "Responsible for designing and overseeing civil engineering projects. This includes structural analysis, site planning, and ensuring compliance with building codes.",
    skills: ["AutoCAD", "Structural Analysis", "Project Management"],
    experience: "3+ Years in Civil Engineering",
    equipment: [
      "Engineering Software Suite",
      "Safety Gear"
    ],
    projectSite: "Denver Downtown Project",
    address: "1500 Larimer St, Denver, CO 80202",
    mapImage: "https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "REQ-8277",
    vendor: "TechLink Systems",
    role: "Senior Technician",
    type: "Offshore",
    qty: "12",
    location: "Houston, TX",
    apps: "142",
    status: "Closed",
    date: "Sep 28, 2023",
    description: "Advanced technical support for offshore operations. Requires expertise in marine systems and remote diagnostics.",
    skills: ["Marine Systems", "Remote Diagnostics", "Technical Support"],
    experience: "5+ Years in Offshore Operations",
    equipment: [
      "Marine Safety Equipment",
      "Diagnostic Tools"
    ],
    projectSite: "Houston Offshore Platform",
    address: "Marine Operations Center, Houston, TX 77001",
    mapImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "REQ-8270",
    vendor: "Urban Builders",
    role: "Crane Operator",
    type: "Heavy Machinery",
    qty: "01",
    location: "Phoenix, AZ",
    apps: "03",
    status: "Cancelled",
    date: "Sep 22, 2023",
    description: "Operate heavy cranes for construction projects. Requires certification and experience with various crane types.",
    skills: ["Crane Operation", "Heavy Machinery", "Safety Protocols"],
    experience: "2+ Years Crane Operating Experience",
    equipment: [
      "Crane Operator Certification",
      "Safety Harness"
    ],
    projectSite: "Phoenix Construction Site",
    address: "456 Industrial Blvd, Phoenix, AZ 85001",
    mapImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "REQ-8264",
    vendor: "Skyline Structures",
    role: "Structural Inspector",
    type: "Contractual",
    qty: "02",
    location: "Seattle, WA",
    apps: "19",
    status: "Open",
    date: "Sep 15, 2023",
    description: "Inspect structural integrity of buildings and infrastructure. Ensure compliance with safety standards and building codes.",
    skills: ["Structural Inspection", "Building Codes", "Safety Standards"],
    experience: "3+ Years in Structural Inspection",
    equipment: [
      "Inspection Tools",
      "Safety Equipment"
    ],
    projectSite: "Seattle High-Rise Project",
    address: "789 Construction Way, Seattle, WA 98101",
    mapImage: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=800"
  },
];

const applicants = [
  {
    id: 1,
    name: "David Chen",
    role: "Safety Lead",
    applied: "2h ago",
    status: "shortlisted",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKmJLsh262yCQOQMYG-HvlIkzOFu994QSnslNbCkf2gzbn3mxmpDdt2Hn6YRDIb41SMTGWjzZJRM7COXSNnVDll3V11xnDWNLQIKUv6ysVB5-2BuEavKk1O_W8ofKROpR9VLJnbTKpUZDrraMQt7YzupiGmMzcT1G0wqWot3kXEYW6NiJ3NN0bRDCRQQgQWW7ATQud4fUCx6tRVaEQ-ARgHiO0lnZzQaEOfpSxmKx9ROOlpfV1hnnNMC2I5oYVTv4yINWXO0kSuhbn",
  },
  {
    id: 2,
    name: "Sarah Jenkins",
    role: "Compliance Off.",
    applied: "5h ago",
    status: "pending",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCPMI--r2otV5axRoQ4tIql4HI1dR3KV3Rd19jIMNVfCqoWJ-JvTyJ99ro04fsH8vVVzA0AaQVP3oUHIFgxlqGc1FU6U9Ft73JtJCmdbb9oSpgtG036MsWv4krd27SYU4VYtKtAxPC6BNunok5cDY-ZHapagbv0hCLNlb0e6UAhpFAzkPMIXMDbOgYU6JJKW64AKGztQZMpE7v4dOmB8UfIHuFQ8o6icPmzic8IsbnqslNR8rBlbUS1C-VcdCBQSmUwLKYlBnIzUO9n",
  },
  {
    id: 3,
    name: "Marcus Thorne",
    role: "Site Supervisor",
    applied: "Oct 23",
    status: "pending",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuARgTL94LeoIgeqWq2tUFM0e1bdCIij7QDieNSiClIV7SWB5dMhMVMqw-CkWkzJC5ml4BEw9MV-1HU1Px8IdDO4YsvPKRqW7-WZLviZG4-_mzYsoDi-PqFrmf59sKI09CjGYG7dYTBQ9hb9FP7pOLd5LxV7ZlmPxaotM4EsRcNz30l_cqe4rgjMpaqr5h5-Leg6SBO-RLEF-DUUCykjQ0r24rujlCu9v-tDAkr4zqQkLfIqVnMBfKQpkYmjIhqhf2YemDV-VQUbjUwX",
  },
  {
    id: 4,
    name: "Elena Rodriguez",
    role: "Safety Manager",
    applied: "Oct 23",
    status: "shortlisted",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAC25uqIP1ZNaWoet0pjBA6Wh57qTt64afGzVObNoKxSL9HUeXD9VGBVlMkvD1yTznRyiTfja6a4YGakozYMSrx1-MeDH-466_IIP1fFGGkmNBeU2u7x1LvMwpVneCTu29un6Rc-x2UuIOpLP2GFl95apijcjNCWcX3XWvYLPPswXUyy3dYDjbgBiCJzMRgXtBJSDcJIYrQf03pCPZNgNCrDYRj_vaof6k6lbataczYmsAjJDpVB4526RUNZDhB5BegiL1tcCHJNIC",
  },
];

const navItems = [
  { icon: "dashboard", label: "Dashboard", active: false },
  { icon: "description", label: "Requirements", active: true },
  { icon: "group", label: "Workers", active: false },
  { icon: "inventory_2", label: "Projects", active: false },
];

function StatusBadge({ status }) {
  const map = {
    shortlisted: { cls: "badge-shortlisted", label: "Shortlisted" },
    pending: { cls: "badge-pending", label: "Pending" },
    open: { cls: "badge-open", label: "Open" },
    filled: { cls: "badge-filled", label: "Filled" },
    closed: { cls: "badge-closed", label: "Closed" },
    cancelled: { cls: "badge-cancelled", label: "Cancelled" },
  };
  const { cls, label } = map[status] || map.pending;
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function App() {
  const { id } = useParams();
  const job = jobsData.find(j => j.id === id) || jobsData[0]; // fallback to first job if not found
  const [searchVal, setSearchVal] = useState("");

  return (
    <div className="app-root">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div className="breadcrumb">
            <span>Requirements</span>
            <span className="material-symbols-outlined breadcrumb-chevron">chevron_right</span>
            <span className="breadcrumb-current">{job.id}</span>
          </div>
          <div className="header-actions">
            <div className="search-wrap">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search requirements..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
            </div>
            <button className="btn btn--neutral">Close Job</button>
            <button className="btn btn--danger">Cancel Job</button>
          </div>
        </header>
        <div className="page-body">
          <div className="page-title-area">
            <div className="page-title-left">
              <div className="title-row">
                <h1 className="page-title">{job.role}</h1>
                <StatusBadge status={job.status.toLowerCase()} />
              </div>
              <p className="page-meta">
                <span className="material-symbols-outlined meta-icon">calendar_today</span>
                Posted on {job.date} • ID: {job.id}
              </p>
            </div>
          </div>
          <div className="content-grid">
            <div className="col-left">
              <div className="card">
                <div className="card-header">
                  <span className="material-symbols-outlined card-header-icon">subject</span>
                  <h3 className="card-title">Job Description</h3>
                </div>
                <div className="card-body">
                  <p className="description-text">{job.description}</p>
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <span className="material-symbols-outlined card-header-icon">verified_user</span>
                  <h3 className="card-title">Worker Requirements</h3>
                </div>
                <div className="card-body">
                  <div className="req-grid">
                    <div className="req-section">
                      <p className="section-label">Required Skills</p>
                      <div className="skills-wrap">
                        {job.skills.map((s) => (
                          <span key={s} className="skill-tag">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="req-section">
                      <p className="section-label">Experience</p>
                      <p className="req-value">{job.experience}</p>
                    </div>
                  </div>
                  <div className="equipment-section">
                    <p className="section-label">Equipment Needed</p>
                    <ul className="equipment-list">
                      {job.equipment.map((item) => (
                        <li key={item} className="equipment-item">
                          <span className="material-symbols-outlined check-icon">check_circle</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <span className="material-symbols-outlined card-header-icon">location_on</span>
                  <h3 className="card-title">Location</h3>
                </div>
                <div className="card-body location-body">
                  <div
                    className="map-thumb"
                    style={{ backgroundImage: `url('${job.mapImage}')` }}
                  />
                  <div className="location-info">
                    <div>
                      <p className="section-label">Project Site</p>
                      <p className="location-name">{job.projectSite}</p>
                      <p className="location-address">{job.address}</p>
                    </div>
                    <button className="directions-btn">
                      Get Directions
                      <span className="material-symbols-outlined">open_in_new</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-right">
              <div className="card applicants-card">
                <div className="card-header">
                  <div className="card-header-left">
                    <span className="material-symbols-outlined card-header-icon">groups</span>
                    <h3 className="card-title">Application List</h3>
                  </div>
                  <span className="total-badge">{job.apps} Total</span>
                </div>
                <div className="table-wrap">
                  <table className="applicants-table">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Applied</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicants.map((a) => (
                        <tr key={a.id} className="applicant-row">
                          <td>
                            <div className="applicant-cell">
                              <img className="applicant-avatar" src={a.avatar} alt={a.name} />
                              <div>
                                <p className="applicant-name">{a.name}</p>
                                <p className="applicant-role">{a.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="applied-time">{a.applied}</td>
                          <td>
                            <StatusBadge status={a.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="card-footer">
                  <button className="view-all-btn">View All Applicants</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}