import React, { useState } from 'react';
import { api } from '../utils/api';

const SAMPLE_MESSY_CSV = `Name,Phone,StartDate,Address,Plan
Rishi Kapoor,+91 98112-33445,01/09/2026,"Flat 12B, Sea Palm, Vashi",Classic Veg
Aarav Patel,+91 98201 98201,2026-09-01,Airoli Tech Park,Classic Veg
,09822334455,1-Sep-2026,"Sector 10, Nerul",Deluxe Homestyle
Sanjay Singhania,98112,01/09/2026,"MIDC, Mahape",Jain Satvik
Meera Nambiar,098776 54321,15/09/2026,"A-302, Blue Ridge, Sanpada",Deluxe Homestyle
Rishi Kapoor Duplicate,+91 98112 33445,05/09/2026,"Same Person Duplicate",Classic Veg
,,,,
Devika Sen,9769911223,September 1, 2026,"Belapur Tower 4",High Protein
`;

export default function ImportModal({ isOpen, onClose, onImportSuccess }) {
  const [inputText, setInputText] = useState(SAMPLE_MESSY_CSV);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState('imported');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleLoadSample = () => {
    setInputText(SAMPLE_MESSY_CSV);
    setReport(null);
    setError(null);
  };

  const handleClear = () => {
    setInputText('');
    setReport(null);
    setError(null);
  };

  const handleExecuteImport = async () => {
    if (!inputText.trim()) {
      setError('Please provide CSV or JSON data to import.');
      return;
    }

    try {
      setImporting(true);
      setError(null);
      const res = await api.importData(inputText);
      setReport(res);
      // Default to imported tab if items exist, else first available
      if (res.imported && res.imported.length > 0) {
        setActiveTab('imported');
      } else if (res.deduped && res.deduped.length > 0) {
        setActiveTab('deduped');
      } else {
        setActiveTab('rejected');
      }
      if (onImportSuccess) {
        onImportSuccess(res);
      }
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-extra-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <span className="modal-icon">📥</span>
            <div>
              <h2>Messy Data Importer & Clean Subscriptions</h2>
              <p className="modal-subtitle">
                Level 3 Twist: Ingest messy customer lists (duplicate phones, mixed date formats, blank lines) into clean subscriptions with an exact &#123; imported, deduped, rejected &#125; report.
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className="alert-banner alert-error">
            <span>{error}</span>
            <button className="alert-close" onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        <div className="import-container">
          {/* Top Panel: Input & Control */}
          <div className="import-input-card">
            <div className="import-card-header">
              <label>Raw Data (CSV with Headers or JSON Array):</label>
              <div className="import-btn-group">
                <button type="button" className="btn btn-sm btn-outline" onClick={handleLoadSample}>
                  ✨ Load Messy Test Sample
                </button>
                <button type="button" className="btn btn-sm btn-outline" onClick={handleClear}>
                  Clear
                </button>
              </div>
            </div>

            <textarea
              className="import-textarea"
              rows="7"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste CSV (Name, Phone, StartDate, Address, Plan) or JSON array..."
            />

            <div className="import-action-bar">
              <div className="import-rules-note">
                <span>🛡️ Auto-normalizes 10-digit phones, resolves DD/MM/YYYY, deduplicates phones, rejects blank lines.</span>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleExecuteImport}
                disabled={importing || !inputText.trim()}
              >
                {importing ? 'Processing & Deduplicating...' : '🚀 Execute Clean Import'}
              </button>
            </div>
          </div>

          {/* Bottom Panel: Structured Report Output */}
          {report && (
            <div className="import-report-card">
              <div className="report-summary-stats">
                <div className="rep-stat rep-stat-imported">
                  <span className="rep-stat-num">{report.imported?.length || 0}</span>
                  <span className="rep-stat-label">Cleanly Subscribed</span>
                </div>
                <div className="rep-stat rep-stat-deduped">
                  <span className="rep-stat-num">{report.deduped?.length || 0}</span>
                  <span className="rep-stat-label">Duplicate Phones Filtered</span>
                </div>
                <div className="rep-stat rep-stat-rejected">
                  <span className="rep-stat-num">{report.rejected?.length || 0}</span>
                  <span className="rep-stat-label">Invalid / Blank Rows</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="report-tabs">
                <button
                  className={`report-tab ${activeTab === 'imported' ? 'active tab-imported' : ''}`}
                  onClick={() => setActiveTab('imported')}
                >
                  ✅ Imported Subscriptions ({report.imported?.length || 0})
                </button>
                <button
                  className={`report-tab ${activeTab === 'deduped' ? 'active tab-deduped' : ''}`}
                  onClick={() => setActiveTab('deduped')}
                >
                  ⚠️ Deduped Records ({report.deduped?.length || 0})
                </button>
                <button
                  className={`report-tab ${activeTab === 'rejected' ? 'active tab-rejected' : ''}`}
                  onClick={() => setActiveTab('rejected')}
                >
                  ❌ Rejected Rows ({report.rejected?.length || 0})
                </button>
              </div>

              {/* Tab 1: Imported */}
              {activeTab === 'imported' && (
                <div className="tab-pane">
                  {(!report.imported || report.imported.length === 0) ? (
                    <div className="tab-empty">No records were imported.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="clean-table">
                        <thead>
                          <tr>
                            <th>Clean Customer</th>
                            <th>Normalized Phone</th>
                            <th>Parsed Start Date</th>
                            <th>Assigned Plan</th>
                            <th>Address</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.imported.map((c) => (
                            <tr key={c.id}>
                              <td>
                                <strong>{c.name}</strong>
                              </td>
                              <td>
                                <code className="code-pill code-phone">{c.phone}</code>
                              </td>
                              <td>{c.startDate}</td>
                              <td>
                                <span className="badge badge-accent">{c.planName}</span>
                              </td>
                              <td className="truncate-cell">{c.address}</td>
                              <td>
                                <span className="badge badge-success">Active Subscriber</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Deduped */}
              {activeTab === 'deduped' && (
                <div className="tab-pane">
                  {(!report.deduped || report.deduped.length === 0) ? (
                    <div className="tab-empty">No duplicate phones found.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="clean-table">
                        <thead>
                          <tr>
                            <th>Row #</th>
                            <th>Customer Name</th>
                            <th>Conflict Phone</th>
                            <th>Deduplication Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.deduped.map((d, i) => (
                            <tr key={i}>
                              <td>
                                <span className="row-pill">Row {d.row || d.index}</span>
                              </td>
                              <td><strong>{d.name || 'Unnamed'}</strong></td>
                              <td>
                                <code className="code-pill code-warning">{d.phone}</code>
                                {d.originalPhone && d.originalPhone !== d.phone && (
                                  <span className="raw-hint"> (raw: {d.originalPhone})</span>
                                )}
                              </td>
                              <td className="reason-text text-warning">{d.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Rejected */}
              {activeTab === 'rejected' && (
                <div className="tab-pane">
                  {(!report.rejected || report.rejected.length === 0) ? (
                    <div className="tab-empty">No invalid rows rejected.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="clean-table">
                        <thead>
                          <tr>
                            <th>Row #</th>
                            <th>Entry Data Snippet</th>
                            <th>Rejection Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.rejected.map((r, i) => (
                            <tr key={i}>
                              <td>
                                <span className="row-pill row-pill-danger">Row {r.row || r.index}</span>
                              </td>
                              <td>
                                <span className="snippet-text">
                                  {r.name || r.phone ? `${r.name || '[Missing Name]'} (${r.phone || '[Missing Phone]'})` : '[Blank Row]'}
                                </span>
                              </td>
                              <td className="reason-text text-danger">{r.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
