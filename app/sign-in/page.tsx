import Link from "next/link"
import { User, EyeOff } from "lucide-react"

export default function SignIn() {
  return (
    <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center px-4">
      <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-sm">
        {/* Logo with decorative elements */}
        <div className="relative mb-4">
          <h1 className="text-6xl md:text-7xl font-serif text-black text-center leading-tight">
            <span className="relative inline-block">
              Lon
              <span className="absolute -top-2 -right-4 text-xl">✦</span>
            </span>
            <br />
            <span className="relative inline-block">TukTak</span>
          </h1>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-6 text-black">
            <span className="text-lg">✦</span>
            <span className="text-xl">✺</span>
          </div>
        </div>

        {/* Welcome heading */}
        <div className="text-center pt-4">
          <h2 className="text-2xl font-semibold text-black mb-1">Welcome back!</h2>
          <p className="text-[#938d7a] text-sm">Sign in to your account</p>
        </div>

        {/* Form */}
        <form action="/dashboard" className="w-full space-y-4">
          {/* Email input */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#938d7a]" />
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-12 pr-4 py-3 bg-[#efece3] rounded-lg border-none outline-none text-black placeholder:text-[#938d7a] focus:ring-2 focus:ring-[#938d7a]/20"
            />
          </div>

          {/* Password input */}
          <div className="relative">
            <EyeOff className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#938d7a]" />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-12 pr-4 py-3 bg-[#efece3] rounded-lg border-none outline-none text-black placeholder:text-[#938d7a] focus:ring-2 focus:ring-[#938d7a]/20"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#1e1e1e] text-white rounded-lg hover:bg-black transition-colors font-medium"
          >
            Sign In
          </button>
        </form>

        {/* Links */}
        <div className="w-full flex justify-between items-center pt-2">
          <Link href="/get-started" className="text-[#938d7a] text-sm hover:text-black transition-colors">
            Create an account
          </Link>
          <Link href="/forgot-password" className="text-[#938d7a] text-sm hover:text-black transition-colors">
            Forgot Password
          </Link>
        </div>
      </div>
    </div>
  )
}
