// src/components/SchoolsPage.jsx

import React, { useEffect, useState } from 'react';

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/schools')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setSchools(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-4 text-gray-500">Loading schools…</p>;
  if (error)   return <p className="p-4 text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {schools.map((school) => (
        <div
          key={school.id}
          className="border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">{school.name}</h2>
          <p className="text-gray-600">{school.address}</p>
          <p className="mt-4 text-sm text-gray-500">
            Teachers: {school.teachers?.length ?? 0}
          </p>
        </div>
      ))}
    </div>
  );
}
