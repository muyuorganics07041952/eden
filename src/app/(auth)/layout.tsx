export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[hsl(140,25%,97%)] flex items-center justify-center p-4">
      {children}
    </div>
  )
}
