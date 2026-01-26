import { SignUp } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function SignUpPage() {
  try {
    const { userId } = await auth();

    // If already signed in, redirect to home
    if (userId) {
      redirect('/');
    }
  } catch (error) {
    // Auth check failed - continue to show sign-up page
    console.error('Auth check failed on sign-up page:', error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <SignUp
        fallbackRedirectUrl="/"
        appearance={{
          elements: {
            formButtonPrimary: 'bg-primary hover:bg-primary/90',
            footerActionLink: 'text-primary hover:text-primary/90',
          },
        }}
      />
    </div>
  );
}
