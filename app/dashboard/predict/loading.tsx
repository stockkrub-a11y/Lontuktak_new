export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#cecabf] border-t-black rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#938d7a]">Loading predictions...</p>
      </div>
    </div>
  )
}
