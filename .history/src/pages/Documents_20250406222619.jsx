import React, { useState, useEffect } from 'react';
import { FaUpload, FaTrash, FaFile, FaFilePdf, FaFileWord, FaFileImage } from 'react-icons/fa';
import axios from 'axios';

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
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

            const response = await axios.post('http://localhost/OJT%20TRACKER/api/documents/index.php', data, {
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

    const getFileIcon = (fileType) => {
        if (fileType.includes('pdf')) return <FaFilePdf className="text-red-500" />;
        if (fileType.includes('word')) return <FaFileWord className="text-blue-500" />;
        if (fileType.includes('image')) return <FaFileImage className="text-green-500" />;
        return <FaFile className="text-gray-500" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

            {/* Documents List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <h2 className="text-xl font-semibold p-4 border-b">OJT Document List</h2>
                {loading ? (
                    <div className="p-4 text-center">Loading...</div>
                ) : error ? (
                    <div className="p-4 text-center text-red-500">{error}</div>
                ) : documents.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No documents found</div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {documents.map((doc) => (
                            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center space-x-4">
                                    <div className="text-2xl">
                                        {getFileIcon(doc.file_type)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium">{doc.title}</h3>
                                        <p className="text-sm text-gray-500">{doc.description}</p>
                                        <p className="text-xs text-gray-400">
                                            {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <a
                                        href={`http://localhost/OJT%20TRACKER/api/uploads/documents/${doc.file_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        View
                                    </a>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Documents; 