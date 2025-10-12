import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center px-4">
      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Logo with decorative elements */}
        <div className="relative">
          <h1 className="text-7xl md:text-8xl font-serif text-black text-center leading-tight">
            <span className="relative inline-block">
              Lon
              <span className="absolute -top-2 -right-4 text-2xl">✦</span>
            </span>
            <br />
            <span className="relative inline-block">TukTak</span>
          </h1>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-6 text-black">
            <span className="text-xl">✦</span>
            <span className="text-2xl">✺</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-8">
          <Link
            href="/get-started"
            className="inline-block px-8 py-3 bg-[#efece3] text-[#938d7a] rounded-full border border-[#938d7a]/20 hover:bg-[#938d7a]/10 transition-colors text-lg font-medium"
          >
            {"Let's Get Started"}
          </Link>
        </div>

        {/* Sign in link */}
        <p className="text-[#938d7a] text-sm">
          Already have an account?{" "}
          <Link href="/sign-in" className="underline hover:text-black transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
