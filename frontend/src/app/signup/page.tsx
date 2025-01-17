import SignUpForm from '@/components/auth/SignUpForm'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white px-8 pb-8 pt-6 shadow">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">CrocodAI</h1>
            <p className="text-gray-600">Create your account</p>
          </div>
          <SignUpForm />
        </div>
      </div>
    </div>
  )
}