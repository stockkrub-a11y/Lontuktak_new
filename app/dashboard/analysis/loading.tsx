export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#cecabf] border-t-[#938d7a] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#938d7a]">Loading analysis...</p>
      </div>
    </div>
  )
}
