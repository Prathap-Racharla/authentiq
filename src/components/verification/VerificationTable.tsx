import React, { useState } from 'react';
import { VerificationRecord } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Link } from 'react-router-dom';
import { Eye, Search, Filter, ArrowUpDown } from 'lucide-react';
import { getRiskLevel, getConfidenceLevel } from '../../utils/formatters';

interface VerificationTableProps {
  verifications: VerificationRecord[];
}

export const VerificationTable: React.FC<VerificationTableProps> = ({ verifications }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = verifications.filter(v => {
    const matchesSearch = 
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, subject, document..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 py-1.5 px-2.5 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="all">All Recommendations</option>
            <option value="Normal Processing">Normal Processing</option>
            <option value="Targeted Verification">Targeted Verification</option>
            <option value="Officer Review">Officer Review</option>
            <option value="Inconclusive">Inconclusive</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Verification ID</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Document</th>
              <th className="py-3 px-4">Biometric</th>
              <th className="py-3 px-4">
                <span className="flex items-center gap-1">
                  Fraud Risk <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">AI Recommendation</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {filtered.map((record) => {
              const riskInfo = getRiskLevel(record.fraudRisk);
              const confInfo = getConfidenceLevel(record.evidenceConfidence);

              return (
                <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400">
                    <Link to={`/verification/${record.id}`} className="hover:underline">
                      {record.id}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200">{record.subjectName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{record.nationality}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={record.evidence.document.status} size="sm" />
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{record.documentType}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={record.evidence.biometric.status} size="sm" />
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{record.evidence.biometric.confidence}% Match</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${riskInfo.badgeBg} ${riskInfo.badgeBorder} ${riskInfo.textColor}`}>
                      {record.fraudRisk} / 100
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${confInfo.badgeBg} ${confInfo.badgeBorder} ${confInfo.textColor}`}>
                      {record.evidenceConfidence} / 100
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={record.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {record.timestamp.split(' ')[1]} UTC
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/verification/${record.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-mono transition-colors border border-slate-700/80"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                  No matching verification records found in synthetic demo dataset.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

