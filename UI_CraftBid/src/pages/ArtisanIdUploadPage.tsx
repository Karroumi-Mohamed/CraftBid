import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowRight, UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import api, { makeRequest, ValidationErrors } from '@/lib/axois';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DocumentUploadErrors {
    id_document_front?: string;
    id_document_back?: string;
    general?: string;
}

const ArtisanIdUploadPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();

    const [idDocumentFront, setIdDocumentFront] = useState<File | null>(null);
    const [idDocumentBack, setIdDocumentBack] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<DocumentUploadErrors>({});
    const [uploadSuccess, setUploadSuccess] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login', { replace: true, state: { message: "Please log in to upload documents." } });
        }
        if (!authLoading && user && !user.roles?.some(r => r.name === 'artisan')) {
            navigate('/dashboard', { replace: true, state: { message: "Document upload is for artisans only." } });
        }
    }, [authLoading, user, navigate]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'front' | 'back') => {
        const file = event.target.files?.[0];
        const errorKey = fileType === 'front' ? 'id_document_front' : 'id_document_back';

        if (file) {
            if (fileType === 'front') setIdDocumentFront(file);
            else if (fileType === 'back') setIdDocumentBack(file);

            setErrors(prev => {
                const newState = { ...prev };
                delete newState[errorKey];
                if (!newState.id_document_front && !newState.id_document_back) {
                    delete newState.general;
                }
                return newState;
            });
        } else {
            if (fileType === 'front') setIdDocumentFront(null);
            else if (fileType === 'back') setIdDocumentBack(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        setUploadSuccess(false);

        let currentErrors: DocumentUploadErrors = {};
        if (!idDocumentFront) {
            currentErrors.id_document_front = 'Front ID Document is required.';
        }
        if (!idDocumentBack) {
            currentErrors.id_document_back = 'Back ID Document is required.';
        }

        if (Object.keys(currentErrors).length > 0) {
            setErrors(currentErrors);
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('id_document_front', idDocumentFront!);
        formData.append('id_document_back', idDocumentBack!);

        const response = await makeRequest(api.post('/artisan/profile/upload-id', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }));

        setIsLoading(false);

        if (response.success) {
            setUploadSuccess(true);
            setTimeout(() => {
                navigate('/status', { replace: true });
            }, 2000);
        } else {
            const errorMsg = response.error?.message || 'Failed to submit documents.';
            if (response.error?.errors) {
                const apiErrors = response.error.errors as ValidationErrors;
                const newErrors: DocumentUploadErrors = {};
                for (const field in apiErrors) {
                    if (apiErrors[field] && apiErrors[field].length > 0) {
                        newErrors[field as keyof DocumentUploadErrors] = apiErrors[field][0];
                    }
                }
                setErrors(newErrors);
                if (Object.keys(newErrors).length > 0) {
                    setErrors(prev => ({ ...prev, general: "Please correct the errors below." }));
                } else {
                    setErrors({ general: errorMsg });
                }
            } else {
                setErrors({ general: errorMsg });
            }
        }
    };

    const renderFileInput = (id: string, label: string, file: File | null, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, error?: string, required: boolean = false) => (
        <div>
            <Label htmlFor={id}>{label} {required && <span className="text-destructive">*</span>}</Label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${error ? 'border-destructive' : 'border-gray-300'} border-dashed rounded-md`}>
                <div className="space-y-1 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                        <label htmlFor={id} className="relative cursor-pointer bg-white rounded-md font-medium text-accent1 hover:text-accent1/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-accent1 px-1">
                            <span>{file ? 'Change file' : 'Upload a file'}</span>
                            <input id={id} name={id} type="file" className="sr-only" onChange={onChange} accept="image/jpeg, image/png, image/jpg" />
                        </label>
                    </div>
                    {file ? ( <p className="text-xs text-gray-500">{file.name}</p> ) : ( <p className="text-xs text-gray-500">JPG, PNG, JPEG up to 2MB</p> )}
                </div>
            </div>
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        </div>
    );

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <>
            <div className='flex justify-between items-center p-5 border-b'>
                <Link to="/status" className='pl-2'>
                    <img src="/logo.png" className="h-10" alt="Logo" />
                </Link>
                <p className='font-medium text-sm text-gray-600'>{user?.email}</p>
            </div>

            <div className='flex flex-col items-center justify-center max-w-lg mx-auto px-6 py-10'>
                <h1 className='text-black text-2xl font-bold mt-4 w-full text-center'>Identity Verification</h1>
                <p className='text-gray-500 text-sm font-medium mt-1 mb-6 w-full text-center'>Upload required documents for verification.</p>

                {errors.general && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{errors.general}</AlertDescription>
                    </Alert>
                )}

                {uploadSuccess ? (
                    <div className="text-center p-6 bg-green-50 border border-green-200 rounded-md">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h3 className="mt-2 text-lg font-medium text-green-800">Documents Submitted</h3>
                        <p className="mt-1 text-sm text-green-700">Your documents are under review. We'll notify you once the process is complete. Redirecting...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className='space-y-6 w-full'>
                        {renderFileInput(
                            'id_document_front',
                            'Front of ID Document (National ID, Passport)',
                            idDocumentFront,
                            (e) => handleFileChange(e, 'front'),
                            errors.id_document_front,
                            true
                        )}
                        {renderFileInput(
                            'id_document_back',
                            'Back of ID Document (National ID, Passport)',
                            idDocumentBack,
                            (e) => handleFileChange(e, 'back'),
                            errors.id_document_back,
                            true
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading || !idDocumentFront || !idDocumentBack}
                            className="w-full bg-accent1 text-white py-3 px-4 rounded-md font-medium flex items-center justify-center gap-2 hover:bg-accent1/90 transition-colors disabled:opacity-70"
                        >
                            {isLoading ? 'Submitting...' : 'Submit Documents'}
                            {!isLoading && <ArrowRight size={20} />}
                        </Button>
                    </form>
                )}
            </div>
        </>
    );
};

export default ArtisanIdUploadPage;
