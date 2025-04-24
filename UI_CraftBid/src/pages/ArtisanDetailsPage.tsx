import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { InputWithError } from '@/components/ui/InputWithError';
import { TextareaWithError } from '@/components/ui/TextareaWithError';
import { Label } from '@/components/ui/label';
import { ArrowRight, UploadCloud, AlertCircle } from 'lucide-react';
import api, { makeRequest, ValidationErrors } from '@/lib/axois';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LocationState {
    email?: string;
    userId?: number;
}

interface Artisan {
    id: number;
}

interface ArtisanDetailsErrors {
    speciality?: string;
    bio?: string;
    location?: string;
    image?: string;
    general?: string;
}

const ArtisanDetailsPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoading: authLoading } = useAuth();

    const state = location.state as LocationState | null;
    const userEmail = user?.email || state?.email;

    const [speciality, setSpeciality] = useState('');
    const [bio, setBio] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const [logo, setLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<ArtisanDetailsErrors>({});

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login', { replace: true, state: { message: "Please log in to continue." } });
        }
        if (!authLoading && user && !user.roles?.some(r => r.name === 'artisan')) {
            navigate('/dashboard', { replace: true });
        }
    }, [authLoading, user, navigate]);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => { setLogoPreview(reader.result as string); };
            reader.readAsDataURL(file);
            setErrors(prev => ({ ...prev, image: undefined }));
        } else {
            setLogo(null);
            setLogoPreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        const formData = new FormData();
        formData.append('speciality', speciality);
        formData.append('bio', bio);
        formData.append('location', locationInput);
        if (logo) {
            formData.append('image', logo);
        }

        const response = await makeRequest<Artisan>(api.post('/artisan/profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }));

        setIsLoading(false);

        if (response.success) {
            navigate('/upload-id', { replace: true, state: { email: userEmail } });
        } else {
            const errorMsg = response.error?.message || 'Failed to save details.';
            if (response.error?.errors) {
                const apiErrors = response.error.errors as ValidationErrors;
                const newErrors: ArtisanDetailsErrors = {};
                for (const field in apiErrors) {
                    if (apiErrors[field] && apiErrors[field].length > 0) {
                        newErrors[field as keyof ArtisanDetailsErrors] = apiErrors[field][0];
                    }
                }
                setErrors(newErrors);
                setErrors(prev => ({ ...prev, general: "Please correct the errors below." }));
            } else {
                setErrors({ general: errorMsg });
            }
        }
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <>
            <div className='flex justify-between items-center p-5 border-b'>
                <Link to="/" className='pl-2'>
                    <img src="/logo.png" className="h-10" alt="Logo" />
                </Link>
                <p className='font-medium text-sm text-gray-600'>{userEmail}</p>
            </div>

            <div className='flex flex-col items-center justify-center max-w-lg mx-auto px-6 py-10'>
                <h1 className='text-black text-2xl font-bold mt-4 w-full text-center'>Artisan Profile Details</h1>
                <p className='text-gray-500 text-sm font-medium mt-1 mb-6 w-full text-center'>Tell us more about your craft business.</p>

                {errors.general && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{errors.general}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className='space-y-6 w-full'>
                    <InputWithError label="Speciality / Craft Type" id="speciality" name="speciality" type="text" placeholder="e.g., Leatherwork, Pottery, Zellige..." required value={speciality} onChange={e => setSpeciality(e.target.value)} disabled={isLoading} error={errors.speciality} />
                    <InputWithError label="Location" id="location" name="location" type="text" placeholder="e.g., Marrakech, Morocco" required value={locationInput} onChange={e => setLocationInput(e.target.value)} disabled={isLoading} error={errors.location} />
                    <TextareaWithError label="Business Bio / Description" id="bio" name="bio" placeholder="Describe your business, your craft..." required value={bio} onChange={e => setBio(e.target.value)} disabled={isLoading} rows={4} error={errors.bio} />

                    <div>
                        <Label htmlFor='logo'>Business Logo (Optional)</Label>
                        <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${errors.image ? 'border-destructive' : 'border-gray-300'} border-dashed rounded-md`}>
                            <div className="space-y-1 text-center">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo preview" className="mx-auto h-24 w-auto rounded object-contain" />
                                ) : (
                                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                )}
                                <div className="flex text-sm text-gray-600 justify-center">
                                    <label htmlFor="logo" className="relative cursor-pointer bg-white rounded-md font-medium text-accent1 hover:text-accent1/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-accent1 px-1">
                                        <span>{logo ? 'Change file' : 'Upload a file'}</span>
                                        <input id="logo" name="image" type="file" className="sr-only" onChange={handleLogoChange} accept="image/png, image/jpeg, image/webp" />
                                    </label>
                                </div>
                                {logo ? ( <p className="text-xs text-gray-500">{logo.name}</p> ) : ( <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 2MB</p> )}
                            </div>
                        </div>
                        {errors.image && <p className="text-sm text-destructive mt-1">{errors.image}</p>}
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full bg-accent1 text-white py-3 px-4 rounded-md font-medium flex items-center justify-center gap-2 hover:bg-accent1/90 transition-colors disabled:opacity-70">
                        {isLoading ? 'Saving Details...' : 'Save & Continue to ID Upload'}
                        {!isLoading && <ArrowRight size={20} />}
                    </Button>
                </form>
            </div>
        </>
    );
};

export default ArtisanDetailsPage;
