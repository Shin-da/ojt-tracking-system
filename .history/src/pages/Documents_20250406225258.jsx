import React, { useState, useEffect } from 'react';
import { FaUpload, FaTrash, FaFile, FaFilePdf, FaFileWord, FaFileImage, FaEye, FaDownload, FaExternalLinkAlt } from 'react-icons/fa';
import axios from 'axios';

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [previewDoc, setPreviewDoc] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'certificate',
        file: null
    });

    const categories = [
        { value: 'clearance', label: 'Exit Clearance' },
        { value: 'endorsement', label: 'Endorsement Letter' },
        { value: 'pds', label: 'Personal Data Sheet' },
        { value: 'journal', label: 'Weekly Journal' },
        { value: 'request', label: 'Request Letters' },
        { value: 'moa', label: 'Memorandum of Agreement' },
        { value: 'acceptance', label: 'Letter of Acceptance' },
        { value: 'waiver', label: 'Waiver' },
        { value: 'intent', label: 'Letter of Intent' },
        { value: 'other', label: 'Other Documents' }
    ];

    useEffect(() => {
        fetchDocuments();
    }, [selectedCategory]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost/OJT%20TRACKER/api/documents/index.php?user_id=1${selectedCategory !== 'all' ? `&category=${selectedCategory}` : ''}`);
            if (response.data.success) {
                setDocuments(response.data.data);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError('Failed to fetch documents');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setFormData({
            ...formData,
            file: e.target.files[0]
        });
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.file) {
            setError('Please select a file');
            return;
        }

        try {
            setUploading(true);
            setError(null);
            
            const data = new FormData();
            data.append('file', formData.file);
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('category', formData.category);
            data.append('user_id', '1');

            // Log the file details
            console.log('File details:', {
                name: formData.file.name,
                type: formData.file.type,
                size: formData.file.size
            });

            // Log the FormData contents
            for (let pair of data.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }

            const response = await axios.post('http://localhost/OJT%20TRACKER/api/documents/upload.php', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log('Upload progress:', percentCompleted + '%');
                }
            });

            console.log('Server response:', response.data);

            if (response.data.success) {
                setFormData({
                    title: '',
                    description: '',
                    category: 'certificate',
                    file: null
                });
                fetchDocuments();
            } else {
                setError(response.data.message || 'Failed to upload document');
            }
        } catch (err) {
            console.error('Upload error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                statusText: err.response?.statusText
            });
            setError(err.response?.data?.message || err.message || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this document?')) {
            return;
        }

        try {
            const response = await axios.delete(`http://localhost/OJT%20TRACKER/api/documents/index.php?id=${id}`);
            if (response.data.success) {
                fetchDocuments();
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError('Failed to delete document');
            console.error(err);
        }
    };

    const getFileIcon = (fileName) => {
        if (!fileName) return <FaFile className="text-gray-500" />;
        const extension = fileName.split('.').pop().toLowerCase();
        if (extension === 'pdf') return <FaFilePdf className="text-red-500" />;
        if (['doc', 'docx'].includes(extension)) return <FaFileWord className="text-blue-500" />;
        if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return <FaFileImage className="text-green-500" />;
        return <FaFile className="text-gray-500" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handlePreview = (doc) => {
        setPreviewDoc(doc);
        setShowPreview(true);
    };

    const handleClosePreview = () => {
        setShowPreview(false);
        setPreviewDoc(null);
    };

    const handleOpenFile = (doc) => {
        // Create a URL for the file
        const fileUrl = `http://localhost/OJT%20TRACKER/api/documents/download.php?file=${encodeURIComponent(doc.file_name)}`;
        window.open(fileUrl, '_blank');
    };

    const handleDownload = (doc) => {
        // Create a URL for the file
        const fileUrl = `http://localhost/OJT%20TRACKER/api/documents/download.php?file=${encodeURIComponent(doc.file_name)}`;
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = doc.file_name;
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">OJT Documents</h1>

            {/* Upload Form */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Upload OJT Document</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Document Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Enter document title (e.g., CITCS-OJT07-Endorsement Letter)"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows="3"
                            placeholder="Enter any additional details about the document"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Document Type</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            {categories.map(category => (
                                <option key={category.value} value={category.value}>
                                    {category.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">File</label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="mt-1 block w-full"
                            accept=".pdf,.doc,.docx"
                            required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Accepted formats: PDF, DOC, DOCX
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : 'Upload Document'}
                    </button>
                </form>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Document Type</label>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                    <option value="all">All Documents</option>
                    {categories.map(category => (
                        <option key={category.value} value={category.value}>
                            {category.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Document List */}
            <div className="bg-white rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center">Loading...</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-red-500">{error}</td>
                                </tr>
                            ) : documents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center">No documents found</td>
                                </tr>
                            ) : (
                                documents.map(doc => (
                                    <tr key={doc.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="mr-2">{getFileIcon(doc.file_name)}</span>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                                                    <div className="text-sm text-gray-500">{doc.file_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {categories.find(c => c.value === doc.category)?.label || doc.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                doc.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handlePreview(doc)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Preview"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                onClick={() => handleOpenFile(doc)}
                                                className="text-green-600 hover:text-green-900"
                                                title="Open"
                                            >
                                                <FaExternalLinkAlt />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                className="text-purple-600 hover:text-purple-900"
                                                title="Download"
                                            >
                                                <FaDownload />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && previewDoc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-medium">{previewDoc.title}</h3>
                            <button 
                                onClick={handleClosePreview}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 flex-grow overflow-auto">
                            {previewDoc.file_name.toLowerCase().endsWith('.pdf') ? (
                                <iframe 
                                    src={`http://localhost/OJT%20TRACKER/api/documents/download.php?file=${encodeURIComponent(previewDoc.file_name)}`}
                                    className="w-full h-full min-h-[60vh]"
                                    title={previewDoc.title}
                                />
                            ) : previewDoc.file_name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                                <img 
                                    src={`http://localhost/OJT%20TRACKER/api/documents/download.php?file=${encodeURIComponent(previewDoc.file_name)}`}
                                    alt={previewDoc.title}
                                    className="max-w-full max-h-[70vh] mx-auto"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-60">
                                    <div className="text-6xl mb-4">{getFileIcon(previewDoc.file_name)}</div>
                                    <p className="text-gray-500">Preview not available for this file type</p>
                                    <div className="mt-4 space-x-2">
                                        <button
                                            onClick={() => handleOpenFile(previewDoc)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            Open File
                                        </button>
                                        <button
                                            onClick={() => handleDownload(previewDoc)}
                                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                        >
                                            Download
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Category</p>
                                    <p className="font-medium">{categories.find(c => c.value === previewDoc.category)?.label || previewDoc.category}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <p className="font-medium">{previewDoc.status}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Uploaded</p>
                                    <p className="font-medium">{new Date(previewDoc.created_at).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">File Name</p>
                                    <p className="font-medium">{previewDoc.file_name}</p>
                                </div>
                            </div>
                            {previewDoc.notes && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500">Notes</p>
                                    <p className="mt-1">{previewDoc.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documents; 