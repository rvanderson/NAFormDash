import React from 'react';

const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-slate-50 p-4">
      <h1 className="text-2xl font-bold mb-8">Form Dashboard</h1>
      <nav>
        <ul>
          <li className="mb-4"><a href="#" className="text-slate-700 hover:text-slate-900">Dashboard</a></li>
          <li className="mb-4"><a href="#" className="text-slate-700 hover:text-slate-900">Forms</a></li>
          <li className="mb-4"><a href="#" className="text-slate-700 hover:text-slate-900">Settings</a></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
