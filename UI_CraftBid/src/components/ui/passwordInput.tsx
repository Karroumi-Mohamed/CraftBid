
import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { EyeIcon, EyeOffIcon } from "lucide-react"

interface PasswordInputProps {
    id?: string
    placeholder?: string
    className?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    value?: string
    required?: boolean
    disabled?: boolean
}

export default function PasswordInput({
    id = "password",
    placeholder = "Enter your password",
    className = "",
    onChange,
    value,
    required = false,
    disabled = false,
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false)

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    return (
        <div className="relative">
            <input
                id={id}
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                className={className}
                onChange={onChange}
                value={value}
                required={required}
                disabled={disabled}
            />
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={togglePasswordVisibility}
                disabled={disabled}
                aria-label={showPassword ? "Hide password" : "Show password"}
            >
                {showPassword ? <EyeOffIcon className="h-4 w-4 text-accent1" /> : <EyeIcon className="h-4 w-4 text-accent1" />}
            </Button>
        </div>
    )
}
