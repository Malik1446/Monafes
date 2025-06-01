import React, { useState, useEffect } from 'react';

export default function TrainingReportTable() {
  const [data, setData] = useState({ completed: [], notCompleted: [] });

  useEffect(() => {
    fetch('/reports/training-status')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4">
      <button
        onClick={handlePrint}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        طباعة التقرير (A4)
      </button>

      <table dir="rtl" className="min-w-full border-collapse table-auto print:table-fixed">
        <thead>
          <tr>
            <th className="border px-2 py-1">#</th>
            <th className="border px-2 py-1">اسم الطالب</th>
            <th className="border px-2 py-1">حالة التدريب</th>
            <th className="border px-2 py-1">سبب التوقف</th>
          </tr>
        </thead>
        <tbody>
          {data.completed.map((s, i) => (
            <tr key={s.id} className="bg-green-100">
              <td className="border px-2 py-1">{i + 1}</td>
              <td className="border px-2 py-1">{s.name}</td>
              <td className="border px-2 py-1">مكتمل</td>
              <td className="border px-2 py-1">-</td>
            </tr>
          ))}
          {data.notCompleted.map((s, i) => (
            <tr key={s.id} className="bg-red-100">
              <td className="border px-2 py-1">{data.completed.length + i + 1}</td>
              <td className="border px-2 py-1">{s.name}</td>
              <td className="border px-2 py-1">غير مكتمل</td>
              <td className="border px-2 py-1">
                {s.stoppedAttempts.map((a, idx) => (
                  <div key={idx}>{a.reason}</div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
