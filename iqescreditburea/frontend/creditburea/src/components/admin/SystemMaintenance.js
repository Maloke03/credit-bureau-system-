import React, { useEffect, useState } from 'react';

const SystemMaintenance = () => {
  const [health, setHealth] = useState('');
  const [backupMessage, setBackupMessage] = useState('');
  const [config, setConfig] = useState({ maintenanceWindow: '', maxLoginAttempts: '' });
  const [newConfig, setNewConfig] = useState({ maintenanceWindow: '', maxLoginAttempts: '' });

  const token = localStorage.getItem('token'); // Assuming you're storing JWT

  useEffect(() => {
    fetchHealth();
    fetchConfig();
  }, []);

  const fetchHealth = async () => {
    const res = await fetch('/api/system/health', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setHealth(data.status);
  };

  const handleBackup = async () => {
    const res = await fetch('/api/system/backup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setBackupMessage(data.message);
  };

  const fetchConfig = async () => {
    const res = await fetch('/api/system/config', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setConfig(data.config);
      setNewConfig(data.config);
    }
  };

  const updateConfig = async () => {
    const res = await fetch('/api/system/config', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newConfig),
    });
    const data = await res.json();
    if (data.success) {
      setConfig(data.config);
      alert('Configuration updated!');
    }
  };

  return (
    <div>
      <h1>System Maintenance</h1>
      <p><strong>MongoDB Status:</strong> {health || 'Loading...'}</p>

      <button onClick={handleBackup}>Perform Backup</button>
      {backupMessage && <p>{backupMessage}</p>}

      <h2>System Configuration</h2>
      <div>
        <label>
          Maintenance Window:
          <input
            type="text"
            value={newConfig.maintenanceWindow}
            onChange={(e) =>
              setNewConfig({ ...newConfig, maintenanceWindow: e.target.value })
            }
          />
        </label>
        <br />
        <label>
          Max Login Attempts:
          <input
            type="number"
            value={newConfig.maxLoginAttempts}
            onChange={(e) =>
              setNewConfig({ ...newConfig, maxLoginAttempts: parseInt(e.target.value) })
            }
          />
        </label>
        <br />
        <button onClick={updateConfig}>Update Config</button>
      </div>
    </div>
  );
};

export default SystemMaintenance;
