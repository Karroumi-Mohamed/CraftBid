import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { InputWithError } from '@/components/ui/InputWithError';
import { TextareaWithError } from '@/components/ui/TextareaWithError';
import { Label } from '@/components/ui/label';
import { UploadCloud, Edit, Check } from 'lucide-react';
import api from '@/lib/axois';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Artisan {
    id: number;
    business_name: string;
    speciality: string;
    location: string;
    bio: string;
    image?: string;
    rating?: number;
    status: string;
    id_verification_status: string;
    id_document_front_path?: string;
    id_document_front_url?: string;
    id_document_back_path?: string;
    id_document_back_url?: string;
    social_media_links?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
    };
    user?: {
        name: string;
        email: string;
    };
}

interface ProfileErrors {
    business_name?: string;
    speciality?: string;
    location?: string;
    bio?: string;
    image?: string;
    general?: string;
}

const ArtisanProfilePage: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    
    const [artisan, setArtisan] = useState<Artisan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [profileLogo, setProfileLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<ProfileErrors>({});
    
    const [businessName, setBusinessName] = useState('');
    const [speciality, setSpeciality] = useState('');
    const [location, setLocation] = useState('');
    const [bio, setBio] = useState('');
    
    useEffect(() => {
        const fetchArtisanProfile = async () => {
            if (!user) return;
            
            setIsLoading(true);
            try {
                const response = await api.get('/artisan/profile');
                setIsLoading(false);
                
                if (response.data) {
                    const artisanData = response.data as Artisan;
                    setArtisan(artisanData);
                    setBusinessName(artisanData.business_name || '');
                    setSpeciality(artisanData.speciality || '');
                    setLocation(artisanData.location || '');
                    setBio(artisanData.bio || '');
                    if (artisanData.image) {
                        setLogoPreview("http://127.0.0.1:8000/storage/" + artisanData.image);
                    }
                    
                    document.querySelectorAll('.artisan-profile-placeholder').forEach(el => el.remove());
                }
            } catch (error) {
                setIsLoading(false);
                setErrors({ general: "Could not load artisan profile." });
                console.error('Error fetching artisan profile:', error);
            }
        };
        
        fetchArtisanProfile();
    }, [user]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            document.querySelectorAll('.artisan-profile-placeholder').forEach(el => el.remove());
        }, 100);
        
        return () => clearTimeout(timer);
    }, [isEditing]);
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => { setLogoPreview(reader.result as string); };
            reader.readAsDataURL(file);
            setErrors(prev => ({ ...prev, image: undefined }));
        }
    };
    
    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        
        const formData = new FormData();
        formData.append('business_name', businessName);
        formData.append('speciality', speciality);
        formData.append('location', location);
        formData.append('bio', bio);
        
        if (profileLogo) {
            formData.append('image', profileLogo);
        }
        
        try {
            const response = await api.post('/artisan/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            setIsLoading(false);
            
            if (response.data) {
                setArtisan(response.data as Artisan);
                setIsEditing(false);
            }
        } catch (error: any) {
            setIsLoading(false);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors as ProfileErrors);
            } else if (error.response?.data?.message) {
                setErrors({ general: error.response.data.message });
            } else {
                setErrors({ general: "Failed to update profile." });
            }
            console.error('Error updating profile:', error);
        }
    };
    
    if (authLoading || isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <p className="text-lg">Loading...</p>
            </div>
        );
    }
    
    if (!artisan) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Could not load artisan profile information.</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bodoni font-bold text-accent1">Artisan Profile</h1>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center">
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                ) : (
                    <Button onClick={() => setIsEditing(false)} variant="outline" className="flex items-center">
                        Cancel
                    </Button>
                )}
            </div>
            
            {errors.general && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
            )}
            
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Profile Image Section */}
                    <div className="flex flex-col items-center">
                        <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-100 mb-4">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <span className="text-gray-500 text-lg">No Image</span>
                                </div>
                            )}
                        </div>
                        
                        {isEditing && (
                            <div className="w-full">
                                <Label htmlFor="logo-upload" className="block mb-1">Profile Image</Label>
                                <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-accent1">
                                    <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center">
                                        <UploadCloud className="h-6 w-6 text-gray-400 mb-2" />
                                        <span className="text-accent1 text-sm">Upload Image</span>
                                        <input 
                                            id="logo-upload" 
                                            type="file" 
                                            className="hidden" 
                                            onChange={handleLogoChange} 
                                            accept="image/jpeg, image/png, image/jpg" 
                                        />
                                    </label>
                                </div>
                                {errors.image && <p className="text-destructive text-sm mt-1">{errors.image}</p>}
                            </div>
                        )}
                        
                        <div className="mt-6 text-center">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                                bg-opacity-10 border
                                ${artisan.id_verification_status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-400' : 
                                artisan.id_verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-400' : 
                                'bg-red-100 text-red-800 border-red-400'}`}>
                                {artisan.id_verification_status === 'confirmed' && <Check className="w-4 h-4 mr-1" />}
                                Verification: {artisan.id_verification_status.charAt(0).toUpperCase() + artisan.id_verification_status.slice(1)}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-grow">
                        {isEditing ? (
                            <form onSubmit={handleUpdateProfile}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <InputWithError
                                        id="business-name"
                                        label="Business Name"
                                        placeholder="Your business name"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        error={errors.business_name}
                                        required
                                        className="w-full"
                                    />
                                    
                                    <InputWithError
                                        id="speciality"
                                        label="Speciality"
                                        placeholder="Your craft speciality"
                                        value={speciality}
                                        onChange={(e) => setSpeciality(e.target.value)}
                                        error={errors.speciality}
                                        required
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="mb-6">
                                    <InputWithError
                                        id="location"
                                        label="Location"
                                        placeholder="City, Region"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        error={errors.location}
                                        required
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="mb-6">
                                    <TextareaWithError
                                        id="bio"
                                        label="Bio"
                                        placeholder="Tell potential buyers about your craft and experience"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        error={errors.bio}
                                        required
                                        className="w-full"
                                        rows={5}
                                    />
                                </div>
                                
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-medium text-gray-900 mb-1">{artisan.business_name}</h2>
                                    <p className="text-gray-500">{artisan.user?.name} • {artisan.user?.email}</p>
                                </div>
                                
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Speciality</h3>
                                    <p>{artisan.speciality}</p>
                                </div>
                                
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                                    <p>{artisan.location}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Bio</h3>
                                    <p className="whitespace-pre-line">{artisan.bio}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtisanProfilePage;
