import React, { useState } from "react";
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, Phone, MapPin, User, Building } from 'lucide-react';
import Modal from '../components/common/Modal';
import { useToastContext } from '../context/ToastContext';

interface DirectoryEntry {
  id: string;
  name: string;
  type: 'branch' | 'department' | 'person' | 'external';
  contact?: string;
  email?: string;
  manager?: string;
  city?: string;
  address?: string;
  department?: string;
  designation?: string;
  phoneExtension?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const mockDirectoryData: DirectoryEntry[] = [
  {
    id: 'DIR001',
    name: 'Head Office',
    type: 'branch',
    contact: '042-111-000-111',
    email: 'head.office@company.com',
    manager: 'Sara Khan',
    city: 'Lahore',
    address: '123 Main Street, Lahore',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2026-05-01'
  },
  {
    id: 'DIR002',
    name: 'Karachi Branch',
    type: 'branch',
    contact: '021-111-000-222',
    email: 'karachi@company.com',
    manager: 'Usman Malik',
    city: 'Karachi',
    address: '456 Business Avenue, Karachi',
    isActive: true,
    createdAt: '2024-02-01',
    updatedAt: '2026-04-15'
  },
  {
    id: 'DIR003',
    name: 'IT Department',
    type: 'department',
    contact: '042-111-000-333',
    email: 'it@company.com',
    manager: 'Ahmed Hassan',
    department: 'IT',
    phoneExtension: '101',
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2026-05-09'
  },
  {
    id: 'DIR004',
    name: 'John Smith',
    type: 'person',
    contact: '042-111-000-444',
    email: 'john.smith@company.com',
    manager: 'Sara Khan',
    city: 'Lahore',
    department: 'HR',
    designation: 'HR Manager',
    phoneExtension: '201',
    isActive: true,
    createdAt: '2024-03-01',
    updatedAt: '2026-05-08'
  }
];

export default function Directory() {
  const { showToast } = useToastContext();
  const { activeRole } = useAuth();
  const [directoryData, setDirectoryData] = useState<DirectoryEntry[]>(mockDirectoryData);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DirectoryEntry | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<DirectoryEntry>>({
    type: 'branch',
    isActive: true
  });

  const filteredData = directoryData.filter(entry => {
    const matchesType = filterType === 'all' || entry.type === filterType;
    const matchesSearch = !searchTerm ||
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.contact?.includes(searchTerm) ||
      entry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.manager?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch && entry.isActive;
  });

  const handleSave = () => {
    if (!formData.name || !formData.type) {
      showToast('Please fill required fields', 'error');
      return;
    }

    const now = new Date().toISOString().split('T')[0];

    if (editingEntry) {
      // Update existing
      setDirectoryData(prev => prev.map(entry =>
        entry.id === editingEntry.id
          ? { ...entry, ...formData, updatedAt: now }
          : entry
      ));
      showToast('Directory entry updated successfully');
    } else {
      // Create new
      const newEntry: DirectoryEntry = {
        id: 'DIR' + String(Date.now()).slice(-3),
        name: formData.name!,
        type: formData.type as any,
        contact: formData.contact,
        email: formData.email,
        manager: formData.manager,
        city: formData.city,
        address: formData.address,
        department: formData.department,
        designation: formData.designation,
        phoneExtension: formData.phoneExtension,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      setDirectoryData(prev => [...prev, newEntry]);
      showToast('Directory entry created successfully');
    }

    setModalOpen(false);
    setEditingEntry(null);
    setFormData({ type: 'branch', isActive: true });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this directory entry?')) {
      setDirectoryData(prev => prev.map(entry =>
        entry.id === id
          ? { ...entry, isActive: false }
          : entry
      ));
      showToast('Directory entry deleted successfully');
    }
  };

  const openEditModal = (entry: DirectoryEntry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingEntry(null);
    setFormData({ type: 'branch', isActive: true });
    setModalOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'branch': return <Building size={16} />;
      case 'department': return <User size={16} />;
      case 'person': return <User size={16} />;
      case 'external': return <Phone size={16} />;
      default: return <MapPin size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'branch': return 'pill-blue';
      case 'department': return 'pill-green';
      case 'person': return 'pill-purple';
      case 'external': return 'pill-orange';
      default: return 'pill-steel';
    }
  };

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Directory Management</div>
          <div className="pg-sub">Comprehensive organization directory with full CRUD operations</div>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={13} /> Add Entry
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            placeholder="Search by name, contact, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: 250 }}
          />
          <select
            className="input select-input"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ width: 150 }}
          >
            <option value="all">All Types</option>
            <option value="branch">Branches</option>
            <option value="department">Departments</option>
            <option value="person">People</option>
            <option value="external">External</option>
          </select>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>
            {filteredData.length} entries found
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="card">
        {filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>
            <Building size={32} style={{ margin: '0 auto 8px', opacity: .4 }} />
            <div style={{ fontSize: 13 }}>No directory entries found</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Manager/Department</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <span className={`pill ${getTypeColor(entry.type)}`}>
                      {getTypeIcon(entry.type)}
                      <span style={{ marginLeft: 4 }}>{entry.type}</span>
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {entry.name}
                    {entry.phoneExtension && (
                      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>
                        Ext: {entry.phoneExtension}
                      </div>
                    )}
                  </td>
                  <td className="mono">{entry.contact || '-'}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{entry.email || '-'}</td>
                  <td>
                    {entry.manager || entry.department || '-'}
                    {entry.designation && (
                      <div style={{ fontSize: 10, color: 'var(--t3)' }}>
                        {entry.designation}
                      </div>
                    )}
                  </td>
                  <td>
                    {entry.city || '-'}
                    {entry.address && (
                      <div style={{ fontSize: 10, color: 'var(--t3)' }}>
                        {entry.address}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="ico-btn"
                        title="Edit"
                        onClick={() => openEditModal(entry)}
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        className="ico-btn"
                        title="Delete"
                        onClick={() => handleDelete(entry.id)}
                        style={{ color: 'var(--red)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEntry(null);
          setFormData({ type: 'branch', isActive: true });
        }}
        title={editingEntry ? 'Edit Directory Entry' : 'Add Directory Entry'}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Type *</label>
              <select
                className="input select-input"
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <option value="branch">Branch</option>
                <option value="department">Department</option>
                <option value="person">Person</option>
                <option value="external">External</option>
              </select>
            </div>
            <div>
              <label className="label">Name *</label>
              <input
                className="input"
                value={formData.name || ''}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Entry name"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Contact</label>
              <input
                className="input"
                value={formData.contact || ''}
                onChange={e => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@company.com"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Manager</label>
              <input
                className="input"
                value={formData.manager || ''}
                onChange={e => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                placeholder="Manager name"
              />
            </div>
            <div>
              <label className="label">City</label>
              <input
                className="input"
                value={formData.city || ''}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
            </div>
          </div>

          {(formData.type === 'person' || formData.type === 'department') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Department</label>
                <input
                  className="input"
                  value={formData.department || ''}
                  onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Department"
                />
              </div>
              {formData.type === 'person' && (
                <div>
                  <label className="label">Designation</label>
                  <input
                    className="input"
                    value={formData.designation || ''}
                    onChange={e => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                    placeholder="Job title"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="label">Address</label>
            <textarea
              className="input"
              rows={2}
              value={formData.address || ''}
              onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Full address"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Phone Extension</label>
              <input
                className="input"
                value={formData.phoneExtension || ''}
                onChange={e => setFormData(prev => ({ ...prev, phoneExtension: e.target.value }))}
                placeholder="Extension number"
              />
            </div>
            <div></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setModalOpen(false);
              setEditingEntry(null);
              setFormData({ type: 'branch', isActive: true });
            }}
          >
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {editingEntry ? 'Update' : 'Create'} Entry
          </button>
        </div>
      </Modal>
    </div>
  );
}
