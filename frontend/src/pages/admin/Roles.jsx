import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';
import CreateRoleModal from '../../components/CreateRoleModal';
import toast from 'react-hot-toast';
import { Trash2, Edit } from 'lucide-react';
import Swal from 'sweetalert2';

const ALL_PERMISSIONS = [
  { key: 'staff_can_send_emails', label: 'Send email to client' },
  { key: 'staff_can_manage_bookings', label: 'Manage bookings' },
  { key: 'staff_can_view_bookings', label: 'View bookings' },
  { key: 'staff_can_manage_customers', label: 'Manage clients' },
  { key: 'staff_can_manage_invoices', label: 'Manage invoices' },
];

export default function Roles() {
  const { activeCompany } = useCompany();
  const [customRoles, setCustomRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadRoles = async () => {
    if (!activeCompany) return;
    try {
      const res = await api.get(`/companies/${activeCompany.id}/custom-roles`);
      setCustomRoles(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadRoles(); }, [activeCompany]);

  const handleCreateRoleFromModal = async (name, description, permissions) => {
    try {
      const roleRes = await api.post(`/companies/${activeCompany.id}/custom-roles`, { name, description });
      const roleId = roleRes.data.data.role_id;

      if (permissions.length > 0) {
        await api.post(`/companies/${activeCompany.id}/custom-roles/${roleId}/permissions`, { permissions });
      }

      await loadRoles();
      toast.success('Role created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create role');
      throw err;
    }
  };

  const toggleRolePermission = async (roleId, permissionKey, currentPermissions) => {
    let newPerms;
    if (currentPermissions.includes(permissionKey)) {
      newPerms = currentPermissions.filter(p => p !== permissionKey);
    } else {
      newPerms = [...currentPermissions, permissionKey];
    }
    
    try {
      await api.post(`/companies/${activeCompany.id}/custom-roles/${roleId}/permissions`, { permissions: newPerms });
      await loadRoles();
      toast.success('Permission updated');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleEditRole = async (roleId, currentName) => {
    const { value: newName } = await Swal.fire({
      title: 'Edit Role Name',
      input: 'text',
      inputValue: currentName,
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) return 'Role name cannot be empty!';
      }
    });

    if (newName && newName !== currentName) {
      try {
        await api.put(`/companies/${activeCompany.id}/custom-roles/${roleId}`, { name: newName });
        await loadRoles();
        toast.success('Role name updated');
      } catch (err) {
        toast.error('Failed to update role name');
      }
    }
  };

  const handleDeleteRole = async (roleId, roleName) => {
    const result = await Swal.fire({
      title: 'Delete role?',
      html: `Are you sure you  want to delete role <b>"${roleName}"</b>?<br/><span class="text-sm text-gray-500">This action can't be undone.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes,delete!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({ title: 'Deleting...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      
      await api.delete(`/companies/${activeCompany.id}/custom-roles/${roleId}`);
      await loadRoles();
      
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: `Role "${roleName}" deleted successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to delete' });
    }
  };

  if (!activeCompany) {
    return <div className="p-12 text-center">Choose a company first.</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create new roles and give permissions on what staff members can do.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Create a new role</h2>
          <p className="text-sm text-slate-500">Create roles to control permissions.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          + Create a new role
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Existing roles</h2>
        
        <div className="space-y-3">
          {customRoles.map(role => (
            <div key={role.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-900">{role.name}</h3>
                  <button
                    onClick={() => handleEditRole(role.id, role.name)}
                    className="text-slate-400 hover:text-indigo-600 transition"
                    title="Edit role name"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{role.permissions.length} permissions</span>
                  <button
                    onClick={() => handleDeleteRole(role.id, role.name)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                    title="Delete role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {ALL_PERMISSIONS.map(perm => (
                  <label key={perm.key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={role.permissions.includes(perm.key)}
                      onChange={() => toggleRolePermission(role.id, perm.key, role.permissions)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    {perm.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
          {customRoles.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No new roles. Create your first role.</p>
          )}
        </div>
      </div>

      <CreateRoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateRoleFromModal}
      />
    </div>
  );
}