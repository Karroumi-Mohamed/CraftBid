import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Label } from "../ui/label"
import PasswordInput from "../ui/passwordInput"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate, useLocation } from "react-router-dom"

export default function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        
        try {
            await login({ email, password })
            // Get return URL from location state or default to home page
            const from = (location.state as any)?.from?.pathname || '/'
            navigate(from)
        } catch (err: any) {
            console.error('Login error:', err)
            if (err.response?.data?.message) {
                setError(err.response.data.message)
            } else if (err.message) {
                setError(err.message)
            } else {
                setError('Failed to login. Please check your credentials.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full mt-5">
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4 text-sm">{error}</div>}
            
            <form onSubmit={handleSubmit} className="w-full">
                <div className="w-full mb-4">
                    <Label htmlFor="email" className="font-medium text-black text-[16px]">Email</Label>
                    <input
                        type="email"
                        id="email"
                        placeholder="johndeo@example.com"
                        className="px-3 py-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-accent1 font-medium text-[16px]"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="w-full mb-4">
                    <Label htmlFor="password" className="font-medium text-black text-[16px]">Password</Label>
                    <PasswordInput
                        id="password"
                        placeholder="minimum 8 characters"
                        className="px-3 py-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-accent1 font-medium text-[16px]"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full cursor-pointer mt-2 bg-accent1 text-white font-semibold text-lg py-3 rounded-md flex items-center justify-center gap-2 hover:bg-accent1/90 transition-colors"
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                    {!loading && <ArrowRight strokeWidth={3} size={16} />}
                </button>
            </form>
        </div>
    )
}
