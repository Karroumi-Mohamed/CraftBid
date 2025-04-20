
import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Label } from "../ui/label"
import PasswordInput from "../ui/passwordInput"
import { Button } from "../ui/button"
export default function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log("Login attempt with:", { email, password })
    }

    return (
        <div className="w-full mt-5">
            <form className="w-full">
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
                    />
                </div>

                <Button className="w-full cursor-pointer mt-2 bg-accent1 text-white font-semibold text-lg py-6" onClick={handleSubmit}>
                    Sign In
                    <ArrowRight strokeWidth={3} size={16}/>
                </Button>
            </form>
        </div>
    )
}
