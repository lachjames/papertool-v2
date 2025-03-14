import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';

// Interfaces for our data structures
interface SeriesMetadata {
  name: string;
  institution: string;
  seriesId: string;
  createdAt: string;
  updatedAt: string;
  paperCount: number;
}

interface PaperMetadata {
  title: string;
  authors: string[];
  abstract?: string;
  keywords?: string[];
  hasPDF: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NewSeriesData {
  seriesId: string;
  name: string;
  institution: string;
}

interface NewPaperData {
  title: string;
  authors: string;
  abstract: string;
  keywords: string;
}

interface ApiConfig {
  key: string;
}

// API base URL
const API_BASE = 'http://localhost:3060/papertool';

function App() {
  const [series, setSeries] = useState<SeriesMetadata[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [papers, setPapers] = useState<PaperMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [paperIds, setPaperIds] = useState<string[]>([]);
  const [paperMetadata, setPaperMetadata] = useState<Record<string, PaperMetadata>>({});

  // Update the fetch papers function
  const fetchPapers = async (seriesId: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_BASE}/series/${seriesId}/papers`);
      if (!response.ok) throw new Error('Failed to fetch papers');
      const ids = await response.json();
      setPaperIds(ids);

      // Fetch metadata for each paper
      await Promise.all(ids.map((id: string) => fetchPaperMetadata(seriesId, id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch papers');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaperMetadata = async (seriesId: string, paperId: string): Promise<void> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE}/series/${seriesId}/papers/${paperId}`
      );
      if (!response.ok) throw new Error('Failed to fetch paper metadata');
      const data = await response.json();
      setPaperMetadata(prev => ({
        ...prev,
        [paperId]: data
      }));
    } catch (err) {
      console.error(`Failed to fetch metadata for paper ${paperId}:`, err);
    }
  };

  // Update the papers list rendering
  const renderPapersList = () => {
    if (!selectedSeries) return null;

    return (
      <div>
        <h3>Papers in Series</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {paperIds.length === 0 ? (
              <p>No papers found in this series.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {paperIds.map((paperId) => {
                  const metadata = paperMetadata[paperId];

                  return (
                    <li key={paperId} style={{
                      marginBottom: '15px',
                      padding: '15px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      {metadata ? (
                        <>
                          <h4 style={{ margin: '0 0 10px 0' }}>{metadata.title}</h4>
                          <div style={{ fontSize: '0.9em', color: '#666' }}>
                            <p>Authors: {metadata.authors.join(', ')}</p>
                            {metadata.abstract && (
                              <p>Abstract: {metadata.abstract}</p>
                            )}
                            {(metadata?.keywords?.length ?? 0) > 0 && (
                              <p>Keywords: {metadata.keywords!.join(', ')}</p>
                            )}
                            <p>Created: {new Date(metadata.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div style={{
                            marginTop: '10px',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center'
                          }}>
                            {metadata.hasPDF && (
                              <span
                                style={{
                                  backgroundColor: '#e3f2fd',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.8em'
                                }}>
                                <a href={`https://papertool-v2-storage.s3.us-east-1.amazonaws.com/RePEc/${selectedSeries}/papers/${paperId}.pdf`} target="_blank" rel="noreferrer">
                                  PDF Available
                                </a>
                              </span>
                            )}
                            <button
                              onClick={() => deletePaper(paperId)}
                              style={{
                                marginLeft: 'auto',
                                padding: '5px 10px',
                                backgroundColor: '#ff4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <span>Loading paper details...</span>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid #f3f3f3',
                            borderTop: '2px solid #3498db',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    );
  };

  // Add this CSS for the loading spinner
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);


  // Form states
  const [newSeriesData, setNewSeriesData] = useState<NewSeriesData>({
    seriesId: '',
    name: '',
    institution: ''
  });

  const [newPaperData, setNewPaperData] = useState<NewPaperData>({
    title: '',
    authors: '',
    abstract: '',
    keywords: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => ({
    key: localStorage.getItem('apiKey') || ''
  }));

  // Helper function for API calls
  const fetchWithAuth = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    if (!apiConfig.key) {
      throw new Error('API key is required');
    }

    const headers = {
      'x-proxy-key': apiConfig.key,
      ...(options.headers || {})
    };

    return fetch(url, {
      ...options,
      headers
    });
  };

  const fetchSeries = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_BASE}/series`);
      if (!response.ok) throw new Error('Failed to fetch series');
      const data = await response.json();
      setSeries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch series');
    } finally {
      setLoading(false);
    }
  };

  const createSeries = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      const response = await fetchWithAuth(`${API_BASE}/series`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSeriesData),
      });
      if (!response.ok) throw new Error('Failed to create series');
      await fetchSeries();
      setNewSeriesData({ seriesId: '', name: '', institution: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create series');
    }
  };

  const createPaper = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!selectedSeries) return;

    const formData = new FormData();
    const paperMetadata = {
      ...newPaperData,
      authors: newPaperData.authors.split(',').map(a => a.trim()),
      keywords: newPaperData.keywords.split(',').map(k => k.trim()),
    };

    formData.append('metadata', JSON.stringify(paperMetadata));

    if (selectedFile) {
      formData.append('pdf', selectedFile);
    }

    try {
      const paperId = Date.now().toString();
      const response = await fetchWithAuth(
        `${API_BASE}/series/${selectedSeries}/papers/${paperId}`,
        {
          method: 'POST',
          body: formData,
        }
      );
      if (!response.ok) throw new Error('Failed to create paper');
      await fetchPapers(selectedSeries);
      setNewPaperData({ title: '', authors: '', abstract: '', keywords: '' });
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create paper');
    }
  };

  const deleteSeries = async (seriesId: string): Promise<void> => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/series/${seriesId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete series');
      await fetchSeries();
      if (selectedSeries === seriesId) {
        setSelectedSeries(null);
        setPapers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete series');
    }
  };

  const deletePaper = async (paperId: string): Promise<void> => {
    if (!selectedSeries) return;
    try {
      const response = await fetchWithAuth(
        `${API_BASE}/series/${selectedSeries}/papers/${paperId}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) throw new Error('Failed to delete paper');
      await fetchPapers(selectedSeries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete paper');
    }
  };

  // Handle API key changes
  const handleApiKeyChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newKey = e.target.value;
    setApiConfig({ key: newKey });
    localStorage.setItem('apiKey', newKey);
  };

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  useEffect(() => {
    if (selectedSeries) {
      fetchPapers(selectedSeries);
    }
  }, [selectedSeries]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>RePEc Paper Management System</h1>

      {/* Add API Key Configuration Section */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#e3f2fd',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <label htmlFor="apiKey" style={{ fontWeight: 'bold' }}>API Key:</label>
        <input
          id="apiKey"
          type="password"
          value={apiConfig.key}
          onChange={handleApiKeyChange}
          placeholder="Enter your API key"
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            flex: '1',
            maxWidth: '300px'
          }}
        />
        {!apiConfig.key && (
          <span style={{ color: 'red' }}>
            Please enter an API key to use the application
          </span>
        )}
      </div>
      {error && (
        <div style={{ color: 'red', margin: '10px 0', padding: '10px', backgroundColor: '#ffe6e6' }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Series Management */}
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <h2>Series Management</h2>
          <form onSubmit={createSeries} style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Series ID"
                value={newSeriesData.seriesId}
                onChange={(e) => setNewSeriesData({ ...newSeriesData, seriesId: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Series Name"
                value={newSeriesData.name}
                onChange={(e) => setNewSeriesData({ ...newSeriesData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Institution"
                value={newSeriesData.institution}
                onChange={(e) => setNewSeriesData({ ...newSeriesData, institution: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create Series
            </button>
          </form>

          <div>
            <h3>Available Series</h3>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {series.map((s) => (
                  <li key={s.seriesId} style={{ marginBottom: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                    <button
                      onClick={() => setSelectedSeries(s.seriesId)}
                      style={{ marginRight: '10px', padding: '5px 10px' }}
                    >
                      {s.name} ({s.seriesId})
                    </button>
                    <button
                      onClick={() => deleteSeries(s.seriesId)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Paper Management */}
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <h2>Paper Management</h2>
          {selectedSeries ? (
            <>
              <form onSubmit={createPaper} style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Paper Title"
                    value={newPaperData.title}
                    onChange={(e) => setNewPaperData({ ...newPaperData, title: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Authors (comma-separated)"
                    value={newPaperData.authors}
                    onChange={(e) => setNewPaperData({ ...newPaperData, authors: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <textarea
                    placeholder="Abstract"
                    value={newPaperData.abstract}
                    onChange={(e) => setNewPaperData({ ...newPaperData, abstract: e.target.value })}
                    style={{ width: '100%', padding: '8px', minHeight: '100px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Keywords (comma-separated)"
                    value={newPaperData.keywords}
                    onChange={(e) => setNewPaperData({ ...newPaperData, keywords: e.target.value })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add Paper
                </button>
              </form>
              {renderPapersList()}
            </>
          ) : (
            <p>Select a series to view papers.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
