import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';
import { Send, User, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePermissions } from '../../contexts/PermissionsContext';

export default function Chat() {
  const { activeCompany } = useCompany();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [inboxSyncError, setInboxSyncError] = useState('');

  // Shtojmë kontrollin e lejeve
  const { hasPermission } = usePermissions();
  const canSendEmail = hasPermission('staff_can_send_emails');

  useEffect(() => {
    if (!activeCompany) return;

    let isMounted = true;
    let syncInProgress = false;
    const syncInbox = async () => {
      if (syncInProgress) return;
      syncInProgress = true;
      try {
        await api.post(`/companies/${activeCompany.id}/sync-inbox`);
        const res = await api.get(`/companies/${activeCompany.id}/chat-customers`);
        if (isMounted) {
          setCustomers(res.data.data || []);
          setInboxSyncError('');
        }
      } catch (err) {
        console.error('Failed to sync the company inbox:', err);
        if (isMounted) {
          setInboxSyncError(err.response?.data?.error || 'Could not sync the inbox. Check the company email settings.');
        }
      } finally {
        syncInProgress = false;
      }
    };

    syncInbox();
    const interval = setInterval(syncInbox, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeCompany]);

  useEffect(() => {
    if (!activeCompany || !selectedCustomer) return;
    
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/companies/${activeCompany.id}/chat?email=${encodeURIComponent(selectedCustomer)}`);
        setMessages(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [activeCompany, selectedCustomer]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedCustomer) return;
    setLoading(true);
    try {
      await api.post(`/companies/${activeCompany.id}/chat`, {
        customer_email: selectedCustomer,
        body: newMessage,
        company_name: activeCompany.name
      });
      setNewMessage('');
      const res = await api.get(`/companies/${activeCompany.id}/chat?email=${encodeURIComponent(selectedCustomer)}`);
      setMessages(res.data.data || []);
    } catch (err) {
      toast.error('Failed to send: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    const toastId = toast.loading('Checking new emails...');
    try {
      const res = await api.post(`/companies/${activeCompany.id}/sync-inbox`);
      setInboxSyncError('');
      toast.success(res.data.data.message, { id: toastId });
      
      if (selectedCustomer) {
        const msgRes = await api.get(`/companies/${activeCompany.id}/chat?email=${encodeURIComponent(selectedCustomer)}`);
        setMessages(msgRes.data.data || []);
      }
      
      const custRes = await api.get(`/companies/${activeCompany.id}/chat-customers`);
      setCustomers(custRes.data.data || []);
      
    } catch (err) {
      setInboxSyncError(err.response?.data?.error || 'Could not sync the inbox. Check the company email settings.');
      toast.error(err.response?.data?.error || 'Sync failed', { id: toastId });
    }
  };

  const filteredCustomers = customers.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Inbox</h2>
            <button 
              onClick={handleSync}
              className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition"
            >
              Sync Emails
            </button>
          </div>
          {inboxSyncError && (
            <p className="mt-2 text-xs text-red-600">{inboxSyncError}</p>
          )}
          <div className="mt-3 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.length === 0 && (
            <div className="p-4 text-center text-sm text-slate-500">
              No new chats.
            </div>
          )}
          {filteredCustomers.map((email) => (
            <div
              key={email}
              onClick={() => setSelectedCustomer(email)}
              className={`p-4 border-b border-slate-100 cursor-pointer transition flex items-center gap-3 ${
                selectedCustomer === email ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-white'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-slate-900 truncate">{email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50">
        {selectedCustomer ? (
          <>
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedCustomer}</h3>
                  <p className="text-xs text-slate-500">Customer</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 mt-10">
                  No messages with this client
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${
                      msg.direction === 'outbound' 
                        ? 'bg-indigo-600 text-white rounded-br-sm' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}>
                      <div className={`text-[10px] font-semibold mb-1 ${
                        msg.direction === 'outbound' ? 'text-indigo-200' : 'text-slate-500'
                      }`}>
                        {msg.direction === 'outbound' ? activeCompany?.name || 'You' : 'Client'}
                      </div>
                      {msg.subject && <div className="font-semibold mb-1">{msg.subject}</div>}
                      {msg.body}
                      <div className={`text-[10px] mt-1 ${msg.direction === 'outbound' ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleString('sq-AL')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* KTU E KEMI VENDOSUR KONTROLLIN E LEJES */}
            <div className="p-4 bg-white border-t border-slate-200">
              {canSendEmail ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading}
                    className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="text-center p-3 bg-slate-50 text-slate-500 rounded-xl text-sm border border-slate-200">
                  You don't have permissions to email client. Contact admin.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 flex-col">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-slate-300" />
            </div>
            <p>Choose a client to show chat</p>
          </div>
        )}
      </div>
    </div>
  );
}